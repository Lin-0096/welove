import { CityConfig } from "./cities";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE_URL = "https://places.googleapis.com/v1";

export type PlaceCategory = "cafe" | "bar" | "restaurant";

export interface Place {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  isOpenNow: boolean | null;
  todayHours: string | null;
  weeklyHours: string[] | null;
}

const CATEGORY_QUERY: Record<PlaceCategory, string> = {
  cafe: "coffee shops",
  bar: "bars",
  restaurant: "restaurants",
};

// Type groups for discover — split across batches to maximise pool size
const DISCOVER_TYPE_BATCHES = [
  ["restaurant", "cafe", "bar"],
  ["tourist_attraction", "museum", "art_gallery"],
  ["night_club", "bakery", "spa"],
  ["shopping_mall", "amusement_park", "bowling_alley"],
  ["park", "aquarium", "zoo"],
];

const DISCOVER_TARGET = 50;
const RATING_STEP = 0.1;

function mapPlace(raw: Record<string, unknown>): Place {
  const hours = raw.currentOpeningHours as Record<string, unknown> | undefined;
  const regularHours = raw.regularOpeningHours as Record<string, unknown> | undefined;
  const activeHours = hours ?? regularHours;

  const weekdayDescriptions = (activeHours?.weekdayDescriptions as string[]) ?? null;
  const isOpenNow = (hours?.openNow as boolean) ?? null;

  let todayHours: string | null = null;
  if (weekdayDescriptions) {
    const dayIndex = new Date().getDay();
    const googleDay = dayIndex === 0 ? 6 : dayIndex - 1;
    const entry = weekdayDescriptions[googleDay];
    if (entry) {
      todayHours = entry.replace(/^[^:]+:\s*/, "");
    }
  }

  return {
    id: raw.id as string,
    name: (raw.displayName as { text: string })?.text ?? "Unknown",
    address: (raw.formattedAddress as string) ?? "",
    rating: (raw.rating as number) ?? 0,
    reviewCount: (raw.userRatingCount as number) ?? 0,
    primaryType: (raw.primaryType as string) ?? "",
    isOpenNow,
    todayHours,
    weeklyHours: weekdayDescriptions,
  };
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.primaryType",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
].join(",");

async function fetchNearby(city: CityConfig, includedTypes: string[]): Promise<Place[]> {
  const res = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: city.center,
          radius: city.radius,
        },
      },
      rankPreference: "POPULARITY",
    }),
    next: { revalidate: 3600 }, // 1h cache
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const rawPlaces = (data.places ?? []) as Record<string, unknown>[];
  return rawPlaces.map(mapPlace);
}

async function fetchText(city: CityConfig, query: string): Promise<Place[]> {
  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${query} in ${city.name} Finland`,
      rankPreference: "RELEVANCE",
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: city.center,
          radius: city.radius,
        },
      },
    }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const rawPlaces = (data.places ?? []) as Record<string, unknown>[];
  return rawPlaces.map(mapPlace);
}

function dedupe(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * Smart discover algorithm:
 * 1. Fetch a large pool (~100 places) from multiple type batches
 * 2. Find the max rating in the pool
 * 3. Fill up to TARGET starting from max rating, stepping down by RATING_STEP
 * 4. Sort each rating bucket by reviewCount desc
 */
export function applyDiscoverAlgorithm(pool: Place[]): Place[] {
  const withRating = pool.filter((p) => p.rating > 0);
  if (withRating.length === 0) return [];

  // Round ratings to 1 decimal
  const rounded = withRating.map((p) => ({
    ...p,
    rating: Math.round(p.rating * 10) / 10,
  }));

  const maxRating = Math.max(...rounded.map((p) => p.rating));

  const result: Place[] = [];
  let currentRating = maxRating;

  while (result.length < DISCOVER_TARGET && currentRating >= 1.0) {
    const bucket = rounded
      .filter((p) => p.rating === currentRating)
      .sort((a, b) => b.reviewCount - a.reviewCount);

    const needed = DISCOVER_TARGET - result.length;
    result.push(...bucket.slice(0, needed));
    currentRating = Math.round((currentRating - RATING_STEP) * 10) / 10;
  }

  return result;
}

export async function getCategoryPlaces(
  city: CityConfig,
  category: PlaceCategory
): Promise<Place[]> {
  const places = await fetchText(city, CATEGORY_QUERY[category]);
  return places
    .filter((p) => p.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
}

export async function getDiscoverPlaces(city: CityConfig): Promise<Place[]> {
  // Fetch all batches in parallel
  const batches = await Promise.all(
    DISCOVER_TYPE_BATCHES.map((types) => fetchNearby(city, types))
  );

  const pool = dedupe(batches.flat());
  return applyDiscoverAlgorithm(pool);
}

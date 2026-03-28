import { CityConfig } from "./cities";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE_URL = "https://places.googleapis.com/v1";

export type PlaceCategory = "cafe" | "bar" | "restaurant";

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  primaryType: string;
  isOpenNow: boolean | null;
  todayHours: string | null;
  weeklyHours: string[] | null;
  specialDays: string[] | null;
}

const CATEGORY_QUERY: Record<PlaceCategory, string> = {
  cafe: "coffee shops",
  bar: "bars",
  restaurant: "restaurants",
};

// Wide type batches for discover — cast a broad net, then rank by popularity
// Google Places API: max 20 results per call, types must be valid Place types
const DISCOVER_TYPE_BATCHES = [
  // Food & drink
  ["restaurant", "cafe", "bar", "bakery", "brewery", "wine_bar", "cocktail_bar", "pub"],
  ["fast_food_restaurant", "pizza_restaurant", "hamburger_restaurant", "sushi_restaurant", "ramen_restaurant"],
  ["seafood_restaurant", "vietnamese_restaurant", "thai_restaurant", "indian_restaurant", "korean_restaurant"],
  ["chinese_restaurant", "japanese_restaurant", "italian_restaurant", "mexican_restaurant", "night_club"],
  // Attractions & culture
  ["tourist_attraction", "museum", "art_gallery", "cultural_center", "performing_arts_theater"],
  ["church", "event_venue"],
  // Nature & outdoor
  ["park", "national_park", "botanical_garden", "nature_preserve", "wildlife_refuge"],
  ["beach", "marina", "ski_resort"],
  // Entertainment
  ["amusement_park", "aquarium", "zoo", "bowling_alley", "movie_theater", "casino"],
  // Wellness & sport
  ["spa", "gym", "swimming_pool", "sauna", "stadium"],
  // Shopping & markets
  ["shopping_mall", "market"],
];

const DISCOVER_TARGET = 50;

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

  // Special days (public holidays with modified hours)
  const rawSpecialDays = (hours?.specialDays as Array<Record<string, unknown>>) ?? null;
  let specialDays: string[] | null = null;
  if (rawSpecialDays && rawSpecialDays.length > 0) {
    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    specialDays = rawSpecialDays
      .filter((d) => {
        const date = d.date as { year: number; month: number; day: number } | undefined;
        if (!date) return false;
        const dt = new Date(date.year, date.month - 1, date.day);
        return dt >= today && dt <= in7Days;
      })
      .map((d) => {
        const date = d.date as { year: number; month: number; day: number };
        return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
      });
    if (specialDays.length === 0) specialDays = null;
  }

  const location = raw.location as { latitude: number; longitude: number } | undefined;

  return {
    id: raw.id as string,
    name: (raw.displayName as { text: string })?.text ?? "Unknown",
    address: (raw.formattedAddress as string) ?? "",
    lat: location?.latitude ?? 0,
    lng: location?.longitude ?? 0,
    rating: (raw.rating as number) ?? 0,
    reviewCount: (raw.userRatingCount as number) ?? 0,
    primaryType: (raw.primaryType as string) ?? "",
    isOpenNow,
    todayHours,
    weeklyHours: weekdayDescriptions,
    specialDays,
  };
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
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
    signal: AbortSignal.timeout(30_000),
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
    signal: AbortSignal.timeout(30_000),
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
 * Discover algorithm: cast a wide net across many place types,
 * then rank purely by review count — the clearest signal of mainstream popularity.
 * Min rating 3.5 to filter out genuinely bad places.
 */
export function applyDiscoverAlgorithm(pool: Place[]): Place[] {
  return pool
    .filter((p) => p.rating >= 3.5 && p.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, DISCOVER_TARGET);
}

const CATEGORY_TARGET = 100;

// Nearby place types per category — catches places text search misses
const CATEGORY_NEARBY_TYPES: Record<PlaceCategory, string[]> = {
  cafe: ["cafe", "coffee_shop", "bakery"],
  bar: ["bar", "night_club"],
  restaurant: [
    "restaurant", "vietnamese_restaurant", "korean_restaurant",
    "japanese_restaurant", "chinese_restaurant", "thai_restaurant",
    "italian_restaurant", "indian_restaurant", "mexican_restaurant",
    "hamburger_restaurant", "pizza_restaurant", "seafood_restaurant",
  ],
};

export async function getCategoryPlaces(
  city: CityConfig,
  category: PlaceCategory
): Promise<Place[]> {
  // Run text search and nearby search in parallel
  const [textPlaces, nearbyPlaces] = await Promise.all([
    fetchText(city, CATEGORY_QUERY[category]),
    fetchNearby(city, CATEGORY_NEARBY_TYPES[category]),
  ]);

  return dedupe([...textPlaces, ...nearbyPlaces])
    .filter((p) => p.rating > 0)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, CATEGORY_TARGET);
}

const HIDDEN_GEM_MIN_REVIEWS = 30;
const HIDDEN_GEM_MAX_REVIEWS = 800;
const HIDDEN_GEM_TARGET = 100;

/**
 * Hidden gems candidate pool: same wide-net fetch as discover,
 * but filter to low-review-count places (under the radar).
 */
export async function getHiddenGemsCandidates(city: CityConfig): Promise<Place[]> {
  const batches = await Promise.all(
    DISCOVER_TYPE_BATCHES.map((types) => fetchNearby(city, types))
  );

  return dedupe(batches.flat())
    .filter(
      (p) =>
        p.rating >= 4.3 &&
        p.reviewCount >= HIDDEN_GEM_MIN_REVIEWS &&
        p.reviewCount <= HIDDEN_GEM_MAX_REVIEWS
    )
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, HIDDEN_GEM_TARGET);
}

export async function getDiscoverPlaces(city: CityConfig): Promise<Place[]> {
  // Fetch all batches in parallel
  const batches = await Promise.all(
    DISCOVER_TYPE_BATCHES.map((types) => fetchNearby(city, types))
  );

  const pool = dedupe(batches.flat());
  return applyDiscoverAlgorithm(pool);
}

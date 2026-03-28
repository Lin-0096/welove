import { db } from "@/lib/db";
import { CityConfig, CITIES } from "@/lib/cities";
import { getDiscoverPlaces, getCategoryPlaces, getHiddenGemsCandidates, Place, PlaceCategory } from "@/lib/google-places";
import { getTransitMinutesFromAirport } from "@/lib/google-maps";
import { PlaceInput, AnalyzedPlace } from "./types";
import { analyzePlaces } from "./analyzer";
import { scorePlaces, scoreHiddenGems } from "./scorer";
import { selectPlaces, selectHiddenGems } from "./selector";

const PRE_FILTER_LIMIT = 20;           // per-category candidate pool
const DISCOVER_PRE_FILTER_LIMIT = 30;  // discover / People Love candidate pool
const CURATED_FINAL_COUNT = 20;        // People Love target count

// Allowed primaryType values per category — used to filter Google Places
// text-search results that may include off-type venues (e.g. shopping malls
// with coffee shops inside appearing in a "coffee shops" text search).
const CATEGORY_ALLOWED_TYPES: Record<PlaceCategory, Set<string>> = {
  cafe: new Set(["cafe", "coffee_shop", "bakery"]),
  bar: new Set(["bar", "pub", "wine_bar", "cocktail_bar", "night_club", "brewery"]),
  restaurant: new Set([
    "restaurant", "vietnamese_restaurant", "korean_restaurant",
    "japanese_restaurant", "chinese_restaurant", "thai_restaurant",
    "italian_restaurant", "indian_restaurant", "mexican_restaurant",
    "hamburger_restaurant", "pizza_restaurant", "seafood_restaurant",
    "sushi_restaurant", "ramen_restaurant", "fast_food_restaurant",
  ]),
};

function prefilterCandidates(rawPlaces: Place[], limit: number): Place[] {
  return [...rawPlaces]
    .sort((a, b) => {
      const scoreA = a.rating * Math.log10(Math.max(a.reviewCount, 1));
      const scoreB = b.rating * Math.log10(Math.max(b.reviewCount, 1));
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

function getDefaultStayMinutes(primaryType: string): number {
  const map: Record<string, number> = {
    restaurant: 60, cafe: 45, coffee_shop: 45, bakery: 30,
    bar: 60, pub: 60, wine_bar: 60, night_club: 90,
    museum: 90, art_gallery: 60, tourist_attraction: 45, cultural_center: 60,
    park: 30, national_park: 60, beach: 60, botanical_garden: 60,
    shopping_mall: 90, market: 45,
    amusement_park: 180, zoo: 120, aquarium: 90,
    spa: 90, sauna: 60,
  };
  return map[primaryType] ?? 45;
}

async function enrichWithMetadata(analyzed: AnalyzedPlace[]): Promise<void> {
  const placeIds = analyzed.map((p) => p.id);
  const existing = await db.placeMetadata.findMany({
    where: { placeId: { in: placeIds } },
    select: { placeId: true },
  });
  const cachedIds = new Set(existing.map((e) => e.placeId));
  const newPlaces = analyzed.filter((p) => !cachedIds.has(p.id));

  // Fetch transit times for new places in parallel
  await Promise.all(
    newPlaces.map(async (p) => {
      const transitMinutes = await getTransitMinutesFromAirport(p.lat, p.lng);
      const stayMinutes = p.stayMinutesOverride ?? getDefaultStayMinutes(p.primaryType);
      await db.placeMetadata.upsert({
        where: { placeId: p.id },
        create: { placeId: p.id, lat: p.lat, lng: p.lng, transitMinutes, stayMinutes, layoverScore: p.layoverScore },
        update: { lat: p.lat, lng: p.lng, transitMinutes, stayMinutes, layoverScore: p.layoverScore },
      });
    })
  );
}

async function getGrowthMap(citySlug: string): Promise<Map<string, { reviewCountDelta: number; ratingDelta: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [latest, oldest] = await Promise.all([
    db.placeSnapshot.findMany({
      where: { citySlug },
      orderBy: { snappedAt: "desc" },
      distinct: ["placeId"],
    }),
    db.placeSnapshot.findMany({
      where: { citySlug, snappedAt: { lte: since } },
      orderBy: { snappedAt: "asc" },
      distinct: ["placeId"],
    }),
  ]);

  const oldestMap = new Map(oldest.map((s) => [s.placeId, s]));
  const result = new Map<string, { reviewCountDelta: number; ratingDelta: number }>();

  for (const cur of latest) {
    const past = oldestMap.get(cur.placeId);
    result.set(cur.placeId, {
      reviewCountDelta: past ? cur.reviewCount - past.reviewCount : 0,
      ratingDelta: past ? Math.round((cur.rating - past.rating) * 100) / 100 : 0,
    });
  }

  return result;
}

export async function curateCity(city: CityConfig): Promise<void> {
  // 1. Fetch places and growth data in parallel
  const [rawPlaces, growthMap] = await Promise.all([
    getDiscoverPlaces(city),
    getGrowthMap(city.slug),
  ]);

  // 2. Pre-filter to top candidates before running AI
  const candidates = prefilterCandidates(rawPlaces, DISCOVER_PRE_FILTER_LIMIT);
  const rawPlaceMap = new Map(rawPlaces.map((p) => [p.id, p]));

  // 3. Build PlaceInput with growth signals and coordinates
  const places: PlaceInput[] = candidates.map((p) => {
    const growth = growthMap.get(p.id) ?? { reviewCountDelta: 0, ratingDelta: 0 };
    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      primaryType: p.primaryType,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      ...growth,
    };
  });

  // 4. Analyze with AI (parallel batches)
  const analyzed = await analyzePlaces(places);

  // 5. Cache transit/stay/layover metadata for new places
  await enrichWithMetadata(analyzed);

  // 6. Score algorithmically
  const scored = scorePlaces(analyzed);

  if (scored.length === 0) return;

  // 5. Select final list (diversity + reasons)
  const curated = await selectPlaces(scored, city.name, CURATED_FINAL_COUNT);

  // 6. Persist to DB — replace previous discover curated list for this city
  await db.$transaction([
    db.curatedPlace.deleteMany({ where: { citySlug: city.slug, category: null } }),
    db.curatedPlace.createMany({
      data: curated.map((e) => ({
        placeId: e.placeId,
        citySlug: city.slug,
        category: null,
        name: e.name,
        rating: e.rating,
        reviewCount: e.reviewCount,
        primaryType: e.primaryType,
        score: e.score,
        reason: e.reason,
        reasonFi: e.reasonFi,
        reasonZh: e.reasonZh,
        rank: e.rank,
        weeklyHours: rawPlaceMap.get(e.placeId)?.weeklyHours ?? [],
        specialDays: rawPlaceMap.get(e.placeId)?.specialDays ?? [],
      })),
    }),
  ]);
}

const CATEGORY_FINAL_COUNT = 10;
const CATEGORIES: PlaceCategory[] = ["cafe", "bar", "restaurant"];

export async function curateCategoryForCity(city: CityConfig, category: PlaceCategory): Promise<void> {
  const [rawPlaces, growthMap] = await Promise.all([
    getCategoryPlaces(city, category),
    getGrowthMap(city.slug),
  ]);

  // Filter to correct primaryType before ranking — prevents text-search results
  // like shopping malls (which contain cafés) from polluting category lists.
  const allowedTypes = CATEGORY_ALLOWED_TYPES[category];
  const typedPlaces = rawPlaces.filter((p) => allowedTypes.has(p.primaryType));
  // Fall back to unfiltered if we somehow end up with too few typed results
  const pool = typedPlaces.length >= PRE_FILTER_LIMIT / 2 ? typedPlaces : rawPlaces;

  const candidates = prefilterCandidates(pool, PRE_FILTER_LIMIT);
  const rawPlaceMap = new Map(rawPlaces.map((p) => [p.id, p]));

  const places: PlaceInput[] = candidates.map((p) => {
    const growth = growthMap.get(p.id) ?? { reviewCountDelta: 0, ratingDelta: 0 };
    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      primaryType: p.primaryType,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      ...growth,
    };
  });

  const analyzed = await analyzePlaces(places);
  await enrichWithMetadata(analyzed);
  const scored = scorePlaces(analyzed);

  if (scored.length === 0) return;

  const curated = await selectPlaces(scored, city.name, CATEGORY_FINAL_COUNT);

  await db.$transaction([
    db.curatedPlace.deleteMany({ where: { citySlug: city.slug, category } }),
    db.curatedPlace.createMany({
      data: curated.map((e) => ({
        placeId: e.placeId,
        citySlug: city.slug,
        category,
        name: e.name,
        rating: e.rating,
        reviewCount: e.reviewCount,
        primaryType: e.primaryType,
        score: e.score,
        reason: e.reason,
        reasonFi: e.reasonFi,
        reasonZh: e.reasonZh,
        rank: e.rank,
        weeklyHours: rawPlaceMap.get(e.placeId)?.weeklyHours ?? [],
        specialDays: rawPlaceMap.get(e.placeId)?.specialDays ?? [],
      })),
    }),
  ]);
}

export async function curateHiddenGemsForCity(city: CityConfig): Promise<void> {
  const [rawPlaces, growthMap] = await Promise.all([
    getHiddenGemsCandidates(city),
    getGrowthMap(city.slug),
  ]);

  const candidates = prefilterCandidates(rawPlaces, PRE_FILTER_LIMIT);
  const rawPlaceMap = new Map(rawPlaces.map((p) => [p.id, p]));

  const places: PlaceInput[] = candidates.map((p) => {
    const growth = growthMap.get(p.id) ?? { reviewCountDelta: 0, ratingDelta: 0 };
    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      primaryType: p.primaryType,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      ...growth,
    };
  });

  const analyzed = await analyzePlaces(places);
  await enrichWithMetadata(analyzed);
  const scored = scoreHiddenGems(analyzed);

  if (scored.length === 0) return;

  const curated = await selectHiddenGems(scored, city.name);

  await db.$transaction([
    db.curatedPlace.deleteMany({ where: { citySlug: city.slug, category: "hidden_gem" } }),
    db.curatedPlace.createMany({
      data: curated.map((e) => ({
        placeId: e.placeId,
        citySlug: city.slug,
        category: "hidden_gem",
        name: e.name,
        rating: e.rating,
        reviewCount: e.reviewCount,
        primaryType: e.primaryType,
        score: e.score,
        reason: e.reason,
        reasonFi: e.reasonFi,
        reasonZh: e.reasonZh,
        rank: e.rank,
        weeklyHours: rawPlaceMap.get(e.placeId)?.weeklyHours ?? [],
        specialDays: rawPlaceMap.get(e.placeId)?.specialDays ?? [],
      })),
    }),
  ]);
}

export async function curateAllTrackedCities(): Promise<{ city: string; ok: boolean }[]> {
  const tracked = await db.trackedCity.findMany();

  const results = await Promise.allSettled(
    tracked.map(async (t) => {
      const city = CITIES[t.citySlug];
      if (!city) return;
      // Run discover curation + all category curations in parallel
      await Promise.all([
        curateCity(city),
        ...CATEGORIES.map((cat) => curateCategoryForCity(city, cat)),
      ]);
      return t.citySlug;
    })
  );

  return results.map((r, i) => ({
    city: tracked[i].citySlug,
    ok: r.status === "fulfilled",
  }));
}

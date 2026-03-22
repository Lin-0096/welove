import { db } from "@/lib/db";
import { CityConfig, CITIES } from "@/lib/cities";
import { getDiscoverPlaces, getCategoryPlaces, PlaceCategory } from "@/lib/google-places";
import { PlaceInput } from "./types";
import { analyzePlaces } from "./analyzer";
import { scorePlaces } from "./scorer";
import { selectPlaces } from "./selector";

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

  const rawPlaceMap = new Map(rawPlaces.map((p) => [p.id, p]));

  // 2. Build PlaceInput with growth signals
  const places: PlaceInput[] = rawPlaces.map((p) => {
    const growth = growthMap.get(p.id) ?? { reviewCountDelta: 0, ratingDelta: 0 };
    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      primaryType: p.primaryType,
      address: p.address,
      ...growth,
    };
  });

  // 3. Analyze with Haiku (parallel batches)
  const analyzed = await analyzePlaces(places);

  // 4. Score algorithmically
  const scored = scorePlaces(analyzed);

  if (scored.length === 0) return;

  // 5. Select final list with Sonnet (diversity + reasons)
  const curated = await selectPlaces(scored, city.name);

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

  const rawPlaceMap = new Map(rawPlaces.map((p) => [p.id, p]));

  const places: PlaceInput[] = rawPlaces.map((p) => {
    const growth = growthMap.get(p.id) ?? { reviewCountDelta: 0, ratingDelta: 0 };
    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      primaryType: p.primaryType,
      address: p.address,
      ...growth,
    };
  });

  const analyzed = await analyzePlaces(places);
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

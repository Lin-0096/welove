import { db } from "./db";
import { CityConfig, CITIES } from "./cities";
import { getDiscoverPlaces } from "./google-places";
import { TrackedCity } from "./generated/prisma/client";

/**
 * Snapshot all discoverable places for a city into the DB.
 */
export async function snapshotCity(city: CityConfig): Promise<void> {
  const places = await getDiscoverPlaces(city);
  if (places.length === 0) return;

  await db.placeSnapshot.createMany({
    data: places.map((p) => ({
      placeId: p.id,
      citySlug: city.slug,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
    })),
  });
}

/**
 * Ensure a city is being tracked.
 * On first visit: register it and take the first snapshot.
 * Subsequent calls are no-ops.
 */
export async function ensureCityTracked(city: CityConfig): Promise<void> {
  const existing = await db.trackedCity.findUnique({
    where: { citySlug: city.slug },
  });

  if (existing) return;

  // Register city
  await db.trackedCity.create({ data: { citySlug: city.slug } });

  // First snapshot (fire and forget from caller)
  await snapshotCity(city);
}

/**
 * Snapshot all currently tracked cities. Called by the cron job.
 */
export async function snapshotAllTrackedCities(): Promise<{ city: string; ok: boolean }[]> {
  const tracked = await db.trackedCity.findMany();

  const results = await Promise.allSettled(
    tracked.map(async (t: TrackedCity) => {
      const city = CITIES[t.citySlug];
      if (!city) return;
      await snapshotCity(city);
      return t.citySlug;
    })
  );

  return results.map((r: PromiseSettledResult<string | undefined>, i: number) => ({
    city: tracked[i].citySlug,
    ok: r.status === "fulfilled",
  }));
}

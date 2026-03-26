import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCity } from "@/lib/cities";
import { PlaceSnapshot } from "@/lib/generated/prisma/client";
import { GrowthEntry } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const citySlug = searchParams.get("city") ?? "helsinki";
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 365);

  const city = getCity(citySlug);
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get latest snapshot per place
  const latest = await db.placeSnapshot.findMany({
    where: { citySlug },
    orderBy: { snappedAt: "desc" },
    distinct: ["placeId"],
  });

  if (latest.length === 0) {
    return NextResponse.json({ entries: [], insufficientData: true });
  }

  // Get oldest snapshot per place within the window
  const oldest = await db.placeSnapshot.findMany({
    where: {
      citySlug,
      snappedAt: { lte: since },
    },
    orderBy: { snappedAt: "asc" },
    distinct: ["placeId"],
  });

  if (oldest.length === 0) {
    return NextResponse.json({ entries: [], insufficientData: true });
  }

  const oldestMap = new Map<string, PlaceSnapshot>(
    oldest.map((s: PlaceSnapshot) => [s.placeId, s])
  );

  const entries: GrowthEntry[] = latest
    .filter((s: PlaceSnapshot) => oldestMap.has(s.placeId))
    .map((current: PlaceSnapshot) => {
      const past = oldestMap.get(current.placeId)!;
      return {
        placeId: current.placeId,
        name: current.name,
        currentRating: current.rating,
        currentReviewCount: current.reviewCount,
        reviewCountDelta: current.reviewCount - past.reviewCount,
        ratingDelta: Math.round((current.rating - past.rating) * 100) / 100,
      };
    })
    .sort((a: GrowthEntry, b: GrowthEntry) => b.reviewCountDelta - a.reviewCountDelta);

  return NextResponse.json({ entries, days, insufficientData: false });
}

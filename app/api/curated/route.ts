import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCity } from "@/lib/cities";

export async function GET(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get("city") ?? "helsinki";

  const city = getCity(citySlug);
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }

  try {
    // Get placeIds already featured in category lists (cafe/bar/restaurant)
    const categoryPlaces = await db.curatedPlace.findMany({
      where: { citySlug, category: { not: null } },
      select: { placeId: true },
    });
    const excludedIds = new Set(categoryPlaces.map((p) => p.placeId));

    // People Love: general list excluding anything already in a category tab
    const places = await db.curatedPlace.findMany({
      where: { citySlug, category: null },
      orderBy: { rank: "asc" },
    });

    const filtered = places.filter((p) => !excludedIds.has(p.placeId));

    return NextResponse.json({ places: filtered, citySlug });
  } catch (err) {
    console.error("[/api/curated]", err);
    return NextResponse.json({ error: "Failed to fetch curated places" }, { status: 500 });
  }
}

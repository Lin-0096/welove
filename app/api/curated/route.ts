import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCity } from "@/lib/cities";
import { isValidLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const citySlug = searchParams.get("city") ?? "helsinki";
  const localeParam = searchParams.get("locale") ?? "en";
  const locale = isValidLocale(localeParam) ? localeParam : "en";

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
    const rows = await db.curatedPlace.findMany({
      where: { citySlug, category: null },
      orderBy: { rank: "asc" },
    });

    const places = rows
      .filter((p) => !excludedIds.has(p.placeId))
      .map(({ reasonFi, reasonZh, ...p }, i) => ({
        ...p,
        rank: i + 1,
        reason:
          locale === "fi" ? (reasonFi || p.reason) :
          locale === "zh" ? (reasonZh || p.reason) :
          p.reason,
      }));

    return NextResponse.json({ places, citySlug });
  } catch (err) {
    console.error("[/api/curated]", err);
    return NextResponse.json({ error: "Failed to fetch curated places" }, { status: 500 });
  }
}

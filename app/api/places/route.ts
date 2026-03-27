import { NextRequest, NextResponse } from "next/server";
import { PlaceCategory } from "@/lib/google-places";
import { getCity } from "@/lib/cities";
import { db } from "@/lib/db";
import { isValidLocale } from "@/lib/i18n";

const VALID_CATEGORIES: PlaceCategory[] = ["cafe", "bar", "restaurant"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") as PlaceCategory;
  const citySlug = searchParams.get("city") ?? "helsinki";
  const localeParam = searchParams.get("locale") ?? "en";
  const locale = isValidLocale(localeParam) ? localeParam : "en";

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "Invalid category. Use: cafe, bar, restaurant" },
      { status: 400 }
    );
  }

  const city = getCity(citySlug);
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }

  try {
    const rows = await db.curatedPlace.findMany({
      where: { citySlug, category },
      orderBy: { rank: "asc" },
    });

    const places = rows.map(({ reasonFi, reasonZh, ...p }) => ({
      ...p,
      reason:
        locale === "fi" ? (reasonFi || p.reason) :
        locale === "zh" ? (reasonZh || p.reason) :
        p.reason,
    }));

    return NextResponse.json({ places });
  } catch (err) {
    console.error("[/api/places]", err);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

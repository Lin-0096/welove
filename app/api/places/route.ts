import { NextRequest, NextResponse } from "next/server";
import { PlaceCategory } from "@/lib/google-places";
import { getCity } from "@/lib/cities";
import { db } from "@/lib/db";

const VALID_CATEGORIES: PlaceCategory[] = ["cafe", "bar", "restaurant"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") as PlaceCategory;
  const citySlug = searchParams.get("city") ?? "helsinki";

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
    const places = await db.curatedPlace.findMany({
      where: { citySlug, category },
      orderBy: { rank: "asc" },
    });
    return NextResponse.json({ places });
  } catch (err) {
    console.error("[/api/places]", err);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

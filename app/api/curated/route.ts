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
    const places = await db.curatedPlace.findMany({
      where: { citySlug },
      orderBy: { rank: "asc" },
    });

    return NextResponse.json({ places, citySlug });
  } catch (err) {
    console.error("[/api/curated]", err);
    return NextResponse.json({ error: "Failed to fetch curated places" }, { status: 500 });
  }
}

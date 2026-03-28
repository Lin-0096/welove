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
    const rows = await db.curatedPlace.findMany({
      where: { citySlug, category: "hidden_gem" },
      orderBy: { rank: "asc" },
    });

    const places = rows.map(({ reasonFi, reasonZh, ...p }) => ({
      ...p,
      reason:
        locale === "fi" ? (reasonFi || p.reason) :
        locale === "zh" ? (reasonZh || p.reason) :
        p.reason,
    }));

    return NextResponse.json({ places, citySlug });
  } catch (err) {
    console.error("[/api/hidden-gems]", err);
    return NextResponse.json({ error: "Failed to fetch hidden gems" }, { status: 500 });
  }
}

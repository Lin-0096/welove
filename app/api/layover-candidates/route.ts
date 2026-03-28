import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const citySlug = searchParams.get("city");
  const localeParam = searchParams.get("locale") ?? "en";

  if (!citySlug) return NextResponse.json({ error: "city required" }, { status: 400 });
  if (!isValidLocale(localeParam)) return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  const locale = localeParam;

  const [curatedPlaces, allMetadata] = await Promise.all([
    db.curatedPlace.findMany({
      where: { citySlug },
      orderBy: { score: "desc" },
    }),
    db.placeMetadata.findMany({
      where: {
        placeId: {
          in: await db.curatedPlace
            .findMany({ where: { citySlug }, select: { placeId: true } })
            .then((rows) => rows.map((r) => r.placeId)),
        },
        layoverScore: { gte: 6 },
      },
    }),
  ]);

  const metaMap = new Map(allMetadata.map((m) => [m.placeId, m]));

  // Deduplicate (same place can appear in multiple categories), keep highest score
  const best = new Map<string, (typeof curatedPlaces)[0]>();
  for (const p of curatedPlaces) {
    const existing = best.get(p.placeId);
    if (!existing || p.score > existing.score) best.set(p.placeId, p);
  }

  const result = [...best.values()]
    .filter((p) => metaMap.has(p.placeId))
    .map((p) => {
      const meta = metaMap.get(p.placeId)!;
      const reason =
        locale === "fi" ? p.reasonFi : locale === "zh" ? p.reasonZh : p.reason;
      return {
        placeId: p.placeId,
        name: p.name,
        primaryType: p.primaryType,
        rating: p.rating,
        reviewCount: p.reviewCount,
        score: p.score,
        reason,
        transitMinutes: meta.transitMinutes,
        stayMinutes: meta.stayMinutes,
        layoverScore: meta.layoverScore,
        lat: meta.lat,
        lng: meta.lng,
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ places: result });
}

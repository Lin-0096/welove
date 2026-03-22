import { NextRequest, NextResponse } from "next/server";
import { snapshotAllTrackedCities, snapshotCity } from "@/lib/snapshot";
import { curateAllTrackedCities, curateCity } from "@/lib/agents/curate";
import { getCity } from "@/lib/cities";

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const citySlug = request.nextUrl.searchParams.get("city");

  try {
    if (citySlug) {
      const city = getCity(citySlug);
      if (!city) {
        return NextResponse.json({ error: `Unknown city: ${citySlug}` }, { status: 400 });
      }
      await snapshotCity(city);
      await curateCity(city);
      return NextResponse.json({ ok: true, city: citySlug });
    }

    const snapshotResults = await snapshotAllTrackedCities();
    const curateResults = await curateAllTrackedCities();
    return NextResponse.json({ ok: true, snapshotResults, curateResults });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/cron/snapshot]", err);
    return NextResponse.json({ error: "Snapshot failed", detail: message }, { status: 500 });
  }
}

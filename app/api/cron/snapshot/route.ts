import { NextRequest, NextResponse } from "next/server";
import { snapshotAllTrackedCities, snapshotCity } from "@/lib/snapshot";
import { curateAllTrackedCities, curateCity } from "@/lib/agents/curate";
import { getCity } from "@/lib/cities";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const citySlug = request.nextUrl.searchParams.get("city");
  // step=snapshot | step=curate | (omit = both, for cron)
  const step = request.nextUrl.searchParams.get("step");

  try {
    if (citySlug) {
      const city = getCity(citySlug);
      if (!city) {
        return NextResponse.json({ error: `Unknown city: ${citySlug}` }, { status: 400 });
      }
      if (step === "snapshot") {
        await snapshotCity(city);
        return NextResponse.json({ ok: true, city: citySlug, step: "snapshot" });
      }
      if (step === "curate") {
        await curateCity(city);
        return NextResponse.json({ ok: true, city: citySlug, step: "curate" });
      }
      // no step param: run both (may timeout on Hobby for heavy cities)
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

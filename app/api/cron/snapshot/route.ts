import { NextRequest, NextResponse } from "next/server";
import { snapshotAllTrackedCities } from "@/lib/snapshot";
import { curateAllTrackedCities } from "@/lib/agents/curate";

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshotResults = await snapshotAllTrackedCities();

    // After snapshotting, run AI curation (results stored in DB)
    const curateResults = await curateAllTrackedCities();

    return NextResponse.json({ ok: true, snapshotResults, curateResults });
  } catch (err) {
    console.error("[/api/cron/snapshot]", err);
    return NextResponse.json({ error: "Snapshot failed" }, { status: 500 });
  }
}

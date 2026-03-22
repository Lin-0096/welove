import { NextResponse } from "next/server";
import { curateCity } from "@/lib/agents/curate";
import { getCity } from "@/lib/cities";
export async function GET() {
  try {
    await curateCity(getCity("helsinki")!);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { CITY_SLUGS } from "@/lib/cities";

type PlaceStatus = "eligible" | "filtered_reviews" | "filtered_rating";

interface PlaceRow {
  rank: number | null;
  name: string;
  rating: number;
  reviewCount: number;
  bRating: number | null;
  quality: number | null;
  semantic: number | null;
  score: number | null;
  status: PlaceStatus;
}

interface DebugData {
  city: string;
  category: string;
  globalMean: number;
  minReviews: number;
  bayesianM: number;
  note: string;
  places: PlaceRow[];
}

const STATUS_LABEL: Record<PlaceStatus, string> = {
  eligible: "✓",
  filtered_reviews: "< 200 reviews",
  filtered_rating: "< 3.5★",
};

const STATUS_CLASS: Record<PlaceStatus, string> = {
  eligible: "text-foreground",
  filtered_reviews: "text-muted-foreground line-through",
  filtered_rating: "text-muted-foreground line-through",
};

export default function DebugPage() {
  const [city, setCity] = useState("helsinki");
  const [category, setCategory] = useState("restaurant");
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/debug-scores?city=${city}&category=${category}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [city, category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mb-2">Debug</p>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">Score Breakdown</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Algorithmic scores only — AI analyzer and growth not included.
          </p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-background border border-border text-sm px-3 py-2 focus:outline-none focus:border-brand"
          >
            {CITY_SLUGS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-background border border-border text-sm px-3 py-2 focus:outline-none focus:border-brand"
          >
            <option value="cafe">Cafés</option>
            <option value="bar">Bars</option>
            <option value="restaurant">Restaurants</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 bg-foreground text-background text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {data && (
          <div className="mb-4 text-xs text-muted-foreground space-y-0.5">
            <p>Global mean: <strong className="text-foreground">{data.globalMean}★</strong> · Min reviews: <strong className="text-foreground">{data.minReviews}</strong> · Bayesian M: <strong className="text-foreground">{data.bayesianM}</strong></p>
            <p className="italic">{data.note}</p>
          </div>
        )}

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground w-8">#</th>
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Name</th>
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground text-right">Reviews</th>
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground text-right">Rating</th>
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground text-right">Bayes★</th>
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground text-right">Quality/80</th>
                  <th className="py-2 pr-4 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground text-right">Score/100</th>
                  <th className="py-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.places.map((p, i) => (
                  <tr key={i} className={`${STATUS_CLASS[p.status]} hover:bg-muted/30`}>
                    <td className="py-2 pr-4 tabular-nums font-medium">{p.rank ?? "—"}</td>
                    <td className="py-2 pr-4 font-medium max-w-[200px] truncate">{p.name}</td>
                    <td className="py-2 pr-4 tabular-nums text-right">{p.reviewCount.toLocaleString()}</td>
                    <td className="py-2 pr-4 tabular-nums text-right">{p.rating.toFixed(1)}★</td>
                    <td className="py-2 pr-4 tabular-nums text-right">{p.bRating?.toFixed(3) ?? "—"}</td>
                    <td className="py-2 pr-4 tabular-nums text-right">{p.quality?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 pr-4 tabular-nums text-right font-bold">{p.score ?? "—"}</td>
                    <td className="py-2 text-xs">{STATUS_LABEL[p.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

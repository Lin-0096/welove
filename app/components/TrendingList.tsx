"use client";

import { useState, useEffect } from "react";
import { GrowthEntry } from "@/lib/types";
import { rankClass } from "@/lib/rank";

interface Props {
  citySlug: string;
}

export function TrendingList({ citySlug }: Props) {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [insufficientData, setInsufficientData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/growth?city=${citySlug}&days=30`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEntries(data.entries);
        setInsufficientData(data.insufficientData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [citySlug]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  if (insufficientData) {
    return (
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">Not enough data yet</p>
        <p className="text-sm mt-2">
          Trending data accumulates over time. Check back in a few days once snapshots have been
          collected.
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">No trending spots yet</p>
        <p className="text-sm mt-2">Trending data will appear as more snapshots are collected.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {entries.map((entry, i) => (
        <TrendingRow key={entry.placeId} entry={entry} rank={i + 1} />
      ))}
    </div>
  );
}

function TrendingRow({ entry, rank }: { entry: GrowthEntry; rank: number }) {
  return (
    <div className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
      <span
        className={`font-display font-black text-xl leading-none shrink-0 w-7 mt-0.5 tabular-nums ${rankClass(rank)}`}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-bold text-lg leading-tight">{entry.name}</h3>
          <span
            className={`text-sm font-semibold shrink-0 tabular-nums ${
              entry.reviewCountDelta > 0 ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {entry.reviewCountDelta > 0 ? "+" : ""}
            {entry.reviewCountDelta.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-muted-foreground tabular-nums">
            {entry.currentReviewCount.toLocaleString()} reviews ·{" "}
            <span aria-label={`Rated ${entry.currentRating.toFixed(1)} out of 5`}>
              {entry.currentRating.toFixed(1)}★
            </span>
          </p>
          {entry.ratingDelta !== 0 && (
            <span
              className={`text-xs font-medium tabular-nums ${
                entry.ratingDelta > 0 ? "text-foreground/70" : "text-muted-foreground"
              }`}
            >
              {entry.ratingDelta > 0 ? "+" : ""}
              {entry.ratingDelta.toFixed(2)}★
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading trending spots" className="space-y-1 mt-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-destructive">
      <p className="font-medium">Failed to load trending data</p>
      <p className="text-sm mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

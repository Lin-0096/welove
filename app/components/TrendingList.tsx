"use client";

import { useState, useEffect } from "react";
import { GrowthEntry } from "@/app/api/growth/route";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  citySlug: string;
}

function rankClass(rank: number): string {
  if (rank === 1) return "text-amber-500 font-black";
  if (rank === 2) return "text-zinc-400 font-black";
  if (rank === 3) return "text-amber-700/70 font-black";
  return "text-muted-foreground/25 font-bold";
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
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Not enough data yet</p>
        <p className="text-sm mt-2">
          Trending data accumulates over time. Check back in a few days once snapshots have been
          collected.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {entries.map((entry, i) => (
        <TrendingCard key={entry.placeId} entry={entry} rank={i + 1} />
      ))}
    </div>
  );
}

function TrendingCard({ entry, rank }: { entry: GrowthEntry; rank: number }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className={`text-xl leading-none shrink-0 w-7 ${rankClass(rank)}`}>
              {rank}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">{entry.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.currentReviewCount.toLocaleString()} reviews · {entry.currentRating.toFixed(1)}★
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant={entry.reviewCountDelta > 0 ? "default" : "secondary"}
              className="text-xs"
            >
              {entry.reviewCountDelta > 0 ? "+" : ""}
              {entry.reviewCountDelta.toLocaleString()} reviews
            </Badge>
            {entry.ratingDelta !== 0 && (
              <span
                className={`text-xs font-medium ${
                  entry.ratingDelta > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {entry.ratingDelta > 0 ? "+" : ""}
                {entry.ratingDelta.toFixed(2)}★
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 mt-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-destructive">
      <p className="font-medium">Failed to load trending data</p>
      <p className="text-sm mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

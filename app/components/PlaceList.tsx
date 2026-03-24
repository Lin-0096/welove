"use client";

import { useState, useEffect } from "react";
import { PlaceCategory } from "@/lib/google-places";
import { Badge } from "@/components/ui/badge";
import { OpeningHours } from "./OpeningHours";

interface CuratedPlace {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  score: number;
  reason: string;
  rank: number;
  weeklyHours: string[];
  specialDays: string[];
}

interface Props {
  category: PlaceCategory;
  citySlug: string;
}

function rankClass(rank: number): string {
  if (rank === 1) return "text-amber-500 font-bold";
  if (rank === 2) return "text-zinc-400 font-bold";
  if (rank === 3) return "text-amber-700/60 font-bold";
  return "text-muted-foreground/30 font-medium";
}

export function PlaceList({ category, citySlug }: Props) {
  const [places, setPlaces] = useState<CuratedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/places?category=${category}&city=${citySlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaces(data.places);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, citySlug]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  if (places.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No curated list yet</p>
        <p className="text-sm mt-2">The AI curation runs daily. Check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {places.map((place) => (
        <PlaceRow key={place.placeId} place={place} />
      ))}
    </div>
  );
}

function PlaceRow({ place }: { place: CuratedPlace }) {
  return (
    <div className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
      <span className={`text-base leading-none shrink-0 w-6 mt-0.5 ${rankClass(place.rank)}`}>
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{place.name}</h3>
          <Badge
            variant="outline"
            className="text-xs shrink-0 font-normal text-muted-foreground border-border/50"
          >
            {place.score.toFixed(0)}pts
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {place.reviewCount.toLocaleString()} reviews · {place.rating.toFixed(1)}★
        </p>
        <p className="text-sm text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/60 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-destructive">
      <p className="font-medium">Failed to load places</p>
      <p className="text-sm mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

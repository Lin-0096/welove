"use client";

import { useState, useEffect } from "react";
import { PlaceCategory } from "@/lib/google-places";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CuratedPlace {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  score: number;
  reason: string;
  rank: number;
}

interface Props {
  category: PlaceCategory;
  citySlug: string;
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
    <div className="grid gap-3">
      {places.map((place) => (
        <PlaceRow key={place.placeId} place={place} />
      ))}
    </div>
  );
}

function PlaceRow({ place }: { place: CuratedPlace }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl font-bold text-muted-foreground/40 leading-none shrink-0 w-7">
            {place.rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">{place.name}</h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {place.score.toFixed(0)}pts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {place.reviewCount.toLocaleString()} reviews · {place.rating.toFixed(1)}★
            </p>
            <p className="text-sm text-foreground/80 mt-1.5 leading-snug">{place.reason}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 mt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
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

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CuratedPlace } from "@/lib/types";
import { rankClass } from "@/lib/rank";
import { OpeningHours } from "./OpeningHours";
import { getT, type Locale } from "@/lib/i18n";

interface Props {
  citySlug: string;
  locale: Locale;
}

const HIGHLIGHTED_TAGS = new Set(["Must Visit"]);

function tagClass(tag: string): string {
  if (HIGHLIGHTED_TAGS.has(tag)) {
    return "bg-status-highlight-bg text-status-highlight-fg border-foreground/15 font-medium";
  }
  return "text-muted-foreground border-border/60";
}

export function CuratedList({ citySlug, locale }: Props) {
  const t = getT(locale);
  const [places, setPlaces] = useState<CuratedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/curated?city=${citySlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaces(data.places);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [citySlug]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={t.errorCurated} />;

  if (places.length === 0) {
    return (
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">{t.noList}</p>
        <p className="text-sm mt-2">{t.checkTomorrow}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {places.map((place) => (
        <CuratedCard key={place.placeId} place={place} t={t} />
      ))}
    </div>
  );
}

function deriveTags(place: CuratedPlace, t: ReturnType<typeof getT>): string[] {
  const typeLabel = (t.typeMap as Record<string, string>)[place.primaryType]
    ?? place.primaryType.replace(/_/g, " ");

  const tags: string[] = [];
  if (typeLabel.trim()) tags.push(typeLabel);

  if (place.reviewCount <= 300) tags.push(t.tags.hiddenGem);
  else if (place.reviewCount <= 1000) tags.push(t.tags.localFavorite);

  if (place.score >= 65) tags.push(t.tags.mustVisit);

  return tags;
}

function CuratedCard({ place, t }: { place: CuratedPlace; t: ReturnType<typeof getT> }) {
  const tags = deriveTags(place, t);

  return (
    <div className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
      <span className={`font-display font-black text-xl leading-none shrink-0 w-7 mt-0.5 tabular-nums ${rankClass(place.rank)}`}>
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg leading-tight">{place.name}</h3>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            <span aria-label={`Rated ${place.rating.toFixed(1)} out of 5`}>
              {place.rating.toFixed(1)}★
            </span>
            {" · "}{place.reviewCount.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`text-xs px-1.5 py-0 ${tagClass(tag)}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-base text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading places" className="space-y-1 mt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-destructive">
      <p className="font-medium">Failed to load curated list</p>
      <p className="text-sm mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

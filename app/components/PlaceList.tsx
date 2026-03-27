"use client";

import { useState, useEffect } from "react";
import { PlaceCategory } from "@/lib/google-places";
import { CuratedPlace } from "@/lib/types";
import { rankClass } from "@/lib/rank";
import { OpeningHours } from "./OpeningHours";
import { getT, HTML_LANG, type Locale } from "@/lib/i18n";

interface Props {
  category: PlaceCategory;
  citySlug: string;
  locale: Locale;
}

export function PlaceList({ category, citySlug, locale }: Props) {
  const t = getT(locale);
  const [places, setPlaces] = useState<CuratedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/places?category=${category}&city=${citySlug}&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaces(data.places);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, citySlug]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={t.errorPlace} />;

  if (places.length === 0) {
    return (
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">{t.noList}</p>
        <p className="text-sm mt-2">{t.checkTomorrow}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {places.map((place) => (
        <PlaceRow key={place.placeId} place={place} locale={locale} />
      ))}
    </ul>
  );
}

function PlaceRow({ place, locale }: { place: CuratedPlace; locale: Locale }) {
  const t = getT(locale);
  const bcp47 = HTML_LANG[locale];

  return (
    <li className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3 list-none">
      <span
        aria-label={`Ranked ${place.rank}`}
        className={`font-display font-black text-xl leading-none shrink-0 w-7 mt-0.5 tabular-nums ${rankClass(place.rank)}`}
      >
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-bold text-lg leading-tight">{place.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {place.reviewCount.toLocaleString(bcp47)} {t.reviewsLabel} ·{" "}
          <span aria-label={`Rated ${place.rating.toFixed(1)} out of 5`}>
            {place.rating.toFixed(1)}★
          </span>
        </p>
        <p className="text-base text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} locale={locale} />
      </div>
    </li>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading places" className="space-y-1 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-destructive">
      <p className="font-medium">{message}</p>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
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

// Module-level cache: persists across tab switches in the same session.
// Key: "category:city:locale", TTL: 5 minutes.
const cache = new Map<string, { places: CuratedPlace[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function PlaceList({ category, citySlug, locale }: Props) {
  const t = getT(locale);
  const cacheKey = `${category}:${citySlug}:${locale}`;
  const cached = cache.get(cacheKey);
  const hasValidCache = cached && Date.now() - cached.ts < CACHE_TTL;

  const [places, setPlaces] = useState<CuratedPlace[]>(hasValidCache ? cached.places : []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const key = `${category}:${citySlug}:${locale}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setPlaces(hit.places);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    fetch(`/api/places?category=${category}&city=${citySlug}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        cache.set(key, { places: data.places, ts: Date.now() });
        setPlaces(data.places);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category, citySlug, locale]);

  if (loading) return <LoadingSkeleton label={t.loadingPlaces} />;
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
        aria-label={t.rankAriaLabel(place.rank)}
        className={`font-display font-black text-xl leading-none shrink-0 w-7 mt-0.5 tabular-nums ${rankClass(place.rank)}`}
      >
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-bold text-lg leading-tight">{place.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          {place.reviewCount.toLocaleString(bcp47)} {t.reviewsLabel} ·{" "}
          <span aria-label={t.ratingAriaLabel(place.rating.toFixed(1))}>
            {place.rating.toFixed(1)}★
          </span>
        </p>
        <p className="text-base text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} locale={locale} />
      </div>
    </li>
  );
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-1 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
      ))}
      <span className="sr-only">{label}</span>
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

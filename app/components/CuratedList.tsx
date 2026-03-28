"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { CuratedPlace } from "@/lib/types";
import { rankClass } from "@/lib/rank";
import { OpeningHours } from "./OpeningHours";
import { getT, HTML_LANG, type Locale } from "@/lib/i18n";

// Module-level cache: persists across tab switches in the same session.
// Key: "endpoint:city:locale", TTL: 5 minutes, max 20 entries.
const cache = new Map<string, { places: CuratedPlace[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 20;

function cacheSet(key: string, value: { places: CuratedPlace[]; ts: number }) {
  if (cache.size >= MAX_CACHE_SIZE) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
}

interface Props {
  citySlug: string;
  locale: Locale;
  endpoint?: string; // defaults to /api/curated
}

function tagClass(highlighted: boolean): string {
  if (highlighted) {
    return "bg-status-highlight-bg text-status-highlight-fg border-foreground/15 font-medium";
  }
  return "text-muted-foreground border-border/60";
}

export function CuratedList({ citySlug, locale, endpoint = "/api/curated" }: Props) {
  const t = getT(locale);
  const cacheKey = `${endpoint}:${citySlug}:${locale}`;
  const cached = cache.get(cacheKey);
  const hasValidCache = cached && Date.now() - cached.ts < CACHE_TTL;

  const [places, setPlaces] = useState<CuratedPlace[]>(hasValidCache ? cached.places : []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const key = `${endpoint}:${citySlug}:${locale}`;
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
    fetch(`${endpoint}?city=${citySlug}&locale=${locale}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        cacheSet(key, { places: data.places, ts: Date.now() });
        setPlaces(data.places);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [citySlug, locale, endpoint]);

  if (loading) return <LoadingSkeleton label={t.loadingPlaces} />;
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
    <ul className="divide-y divide-border/50">
      {places.map((place) => (
        <CuratedCard key={place.placeId} place={place} t={t} locale={locale} />
      ))}
    </ul>
  );
}

interface TagItem {
  text: string;
  highlight: boolean;
}

function deriveTags(place: CuratedPlace, t: ReturnType<typeof getT>): TagItem[] {
  const typeLabel = (t.typeMap as Record<string, string>)[place.primaryType]
    ?? place.primaryType.replace(/_/g, " ");

  const tags: TagItem[] = [];
  if (typeLabel.trim()) tags.push({ text: typeLabel, highlight: false });

  if (place.reviewCount <= 300) tags.push({ text: t.tags.hiddenGem, highlight: false });
  else if (place.reviewCount <= 1000) tags.push({ text: t.tags.localFavorite, highlight: false });

  if (place.score >= 65) tags.push({ text: t.tags.mustVisit, highlight: true });

  return tags;
}

function CuratedCard({ place, t, locale }: { place: CuratedPlace; t: ReturnType<typeof getT>; locale: Locale }) {
  const tags = deriveTags(place, t);

  return (
    <li className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3 list-none">
      <span
        aria-label={t.rankAriaLabel(place.rank)}
        className={`font-display font-black text-xl leading-none shrink-0 w-7 mt-0.5 tabular-nums ${rankClass(place.rank)}`}
      >
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg leading-tight">{place.name}</h3>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            <span aria-label={t.ratingAriaLabel(place.rating.toFixed(1))}>
              {place.rating.toFixed(1)}★
            </span>
            {" · "}{place.reviewCount.toLocaleString(HTML_LANG[locale])}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map(({ text, highlight }) => (
            <Badge
              key={text}
              variant="outline"
              className={`text-xs px-1.5 py-0 ${tagClass(highlight)}`}
            >
              {text}
            </Badge>
          ))}
        </div>
        <p className="text-base text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} locale={locale} />
      </div>
    </li>
  );
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-1 mt-2">
      {Array.from({ length: 10 }).map((_, i) => (
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

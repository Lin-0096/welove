"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { getT, HTML_LANG, type Locale } from "@/lib/i18n";

interface Candidate {
  placeId: string;
  name: string;
  primaryType: string;
  rating: number;
  reviewCount: number;
  score: number;
  reason: string;
  transitMinutes: number;
  stayMinutes: number;
  layoverScore: number;
  lat: number;
  lng: number;
}

interface Props {
  citySlug: string;
  locale: Locale;
  availableMinutes: number;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function walkMinutes(distM: number): number {
  return Math.round(distM / 80); // ~80m/min walking pace
}

// Module-level cache: keyed by "city:locale". Capped at MAX_CACHE_SIZE entries.
const cache = new Map<string, { places: Candidate[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 20;

function cacheSet(key: string, value: { places: Candidate[]; ts: number }) {
  if (cache.size >= MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, value);
}

export function LayoverPlanner({ citySlug, locale, availableMinutes }: Props) {
  const t = getT(locale);
  const cacheKey = `${citySlug}:${locale}`;
  const cached = cache.get(cacheKey);
  const hasValid = cached && Date.now() - cached.ts < CACHE_TTL;

  const [all, setAll] = useState<Candidate[]>(hasValid ? cached.places : []);
  const [loading, setLoading] = useState(!hasValid);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setAll(hit.places);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/layover-candidates?city=${citySlug}&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        const places = data.places ?? [];
        cacheSet(cacheKey, { places, ts: Date.now() });
        setAll(places);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citySlug, locale]);

  // Filter: time must fit, layoverScore >= 6 (already pre-filtered by API)
  const eligible = useMemo(
    () =>
      all
        .filter((p) => p.transitMinutes * 2 + p.stayMinutes < availableMinutes * 0.85)
        .slice(0, 20),
    [all, availableMinutes]
  );

  // Memoize derived selection metrics — recalculated on every timer tick otherwise
  const selectedList = useMemo(
    () => eligible.filter((p) => selected.has(p.placeId)),
    [eligible, selected]
  );

  const { totalUsedMinutes, budgetPct } = useMemo(() => {
    const maxTransit = selectedList.reduce((max, p) => Math.max(max, p.transitMinutes), 0);
    const totalUsedMinutes = selectedList.reduce((acc, p) => acc + p.stayMinutes, 0) + maxTransit * 2;
    const budgetPct = Math.min((totalUsedMinutes / availableMinutes) * 100, 100);
    return { totalUsedMinutes, budgetPct };
  }, [selectedList, availableMinutes]);

  const hours = Math.floor(availableMinutes / 60);
  const mins = availableMinutes % 60;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Nearest walking distance from a candidate to any selected place
  function nearestWalkMin(p: Candidate): number | null {
    if (selectedList.length === 0) return null;
    const nearest = selectedList.reduce((minD, s) => {
      if (s.placeId === p.placeId) return minD;
      const d = haversineMeters(p.lat, p.lng, s.lat, s.lng);
      return d < minD ? d : minD;
    }, Infinity);
    return nearest === Infinity ? null : walkMinutes(nearest);
  }

  if (loading) {
    return (
      <div className="mt-8 space-y-1" role="status" aria-label={t.loading}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
        ))}
        <span className="sr-only">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Mode 2 header */}
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold tracking-tight leading-tight">
          {t.layover.header(hours, mins)}
        </h2>
        {eligible.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {t.layover.eligibleCount(eligible.length)}
          </p>
        )}
      </div>

      {eligible.length === 0 ? (
        <div className="py-16 text-muted-foreground">
          <p className="text-lg font-medium">{t.layover.noFit}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/50">
            {eligible.map((place) => {
              const isSelected = selected.has(place.placeId);
              const walkMin = !isSelected ? nearestWalkMin(place) : null;
              const typeLabel =
                (t.typeMap as Record<string, string>)[place.primaryType] ??
                place.primaryType.replace(/_/g, " ");

              return (
                <li key={place.placeId} className="list-none">
                  <button
                    onClick={() => toggle(place.placeId)}
                    aria-pressed={isSelected}
                    className={`w-full text-left flex items-start gap-3 px-3 py-3.5 rounded-lg transition-colors -mx-3 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-1 ${
                      isSelected
                        ? "bg-brand/8 [box-shadow:inset_2px_0_0_var(--color-brand)]"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-display font-bold text-lg leading-tight ${isSelected ? "text-brand" : ""}`}>
                          {place.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {place.rating.toFixed(1)}★
                          {" · "}
                          {place.reviewCount.toLocaleString(HTML_LANG[locale])}
                        </span>
                      </div>

                      {/* Meta row: type + time stats */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        {typeLabel && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 text-muted-foreground border-border/60"
                          >
                            {typeLabel}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {place.transitMinutes} min · {t.layover.fromAirport}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {place.stayMinutes} min {t.layover.stayLabel}
                        </span>
                        {walkMin !== null && walkMin <= 20 && (
                          <span className="text-xs text-brand font-medium">
                            {t.layover.walkMin(walkMin)}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground/70 mt-1.5 leading-snug line-clamp-2">
                        {place.reason}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Time budget footer */}
          <div className="sticky bottom-0 mt-6 pb-4 pt-3 bg-background border-t border-border/60">
            <p
              id="budget-label"
              className={`text-xs mb-2 transition-colors ${budgetPct > 90 ? "text-destructive font-medium" : "text-muted-foreground"}`}
            >
              {t.layover.selectedTime(totalUsedMinutes, availableMinutes)}
            </p>
            <div className="h-px bg-muted overflow-hidden">
              <div
                className={`h-full w-full origin-left motion-safe:transition-[transform,background-color] motion-safe:duration-300 ${
                  budgetPct > 90 ? "bg-destructive" : "bg-brand"
                }`}
                style={{ transform: `scaleX(${budgetPct / 100})` }}
                role="progressbar"
                aria-labelledby="budget-label"
                aria-valuemin={0}
                aria-valuenow={totalUsedMinutes}
                aria-valuemax={availableMinutes}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

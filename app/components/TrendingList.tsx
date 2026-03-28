"use client";

import { useState, useEffect } from "react";
import { GrowthEntry } from "@/lib/types";
import { rankClass } from "@/lib/rank";
import { getT, HTML_LANG, type Locale } from "@/lib/i18n";

interface Props {
  citySlug: string;
  locale: Locale;
}

export function TrendingList({ citySlug, locale }: Props) {
  const t = getT(locale);
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

  if (loading) return <LoadingSkeleton label={t.trending.loadingLabel} srLabel={t.loading} />;
  if (error) return <ErrorState heading={t.trending.loadingError} />;

  if (insufficientData) {
    return (
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">{t.trending.noDataYet}</p>
        <p className="text-sm mt-2">{t.trending.noDataBody}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">{t.trending.noSpotsYet}</p>
        <p className="text-sm mt-2">{t.trending.noSpotsBody}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {entries.map((entry, i) => (
        <TrendingRow key={entry.placeId} entry={entry} rank={i + 1} locale={locale} />
      ))}
    </ul>
  );
}

function TrendingRow({ entry, rank, locale }: { entry: GrowthEntry; rank: number; locale: Locale }) {
  const t = getT(locale);
  const bcp47 = HTML_LANG[locale];

  return (
    <li className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3 list-none">
      <span
        aria-label={t.rankAriaLabel(rank)}
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
            {entry.reviewCountDelta.toLocaleString(bcp47)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-muted-foreground tabular-nums">
            {entry.currentReviewCount.toLocaleString(bcp47)} {t.reviewsLabel}
            {" · "}
            <span aria-label={t.ratingAriaLabel(entry.currentRating.toFixed(1))}>
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
    </li>
  );
}

function LoadingSkeleton({ label, srLabel }: { label: string; srLabel: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-1 mt-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
      ))}
      <span className="sr-only">{srLabel}</span>
    </div>
  );
}

function ErrorState({ heading }: { heading: string }) {
  return (
    <div className="py-12 text-destructive">
      <p className="font-medium">{heading}</p>
    </div>
  );
}

import { AnalyzedPlace, ScoredPlace } from "./types";

const BAYESIAN_M = 300; // minimum review threshold

// Bayesian average: pulls low-review places toward the global mean
function bayesianRating(rating: number, reviewCount: number, globalMean: number): number {
  return (reviewCount / (reviewCount + BAYESIAN_M)) * rating +
         (BAYESIAN_M / (reviewCount + BAYESIAN_M)) * globalMean;
}

// Normalize review count growth to 0-1 (50+ new reviews = max)
function growthScore(delta: number): number {
  return Math.min(Math.max(delta, 0) / 50, 1);
}

export function scorePlaces(places: AnalyzedPlace[]): ScoredPlace[] {
  const filtered = places.filter((p) => !p.redFlag && p.rating >= 3.5);

  // Global mean rating across the filtered set
  const globalMean = filtered.length > 0
    ? filtered.reduce((sum, p) => sum + p.rating, 0) / filtered.length
    : 4.0;

  return filtered
    .map((p) => {
      // Quality: 80 pts — Bayesian-adjusted rating (primary signal)
      const bRating = bayesianRating(p.rating, p.reviewCount, globalMean);
      const quality = (bRating / 5) * 80;

      // Growth: 10 pts — recent momentum
      const growth = growthScore(p.reviewCountDelta) * 10;

      // Semantic: 10 pts — AI uniqueness + appeal (tiebreaker only)
      const semantic = ((p.uniqueness + p.appeal) / 20) * 10;

      const score = Math.round(quality + growth + semantic);

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

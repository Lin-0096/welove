import { AnalyzedPlace, ScoredPlace } from "./types";

// Higher M = stronger pull toward mean for low-review places
const BAYESIAN_M = 2000;

// log-scale popularity: 50k+ reviews = full 10 pts
const POPULARITY_MAX_REVIEWS = 50000;

// Bayesian average: pulls low-review places toward the global mean
function bayesianRating(rating: number, reviewCount: number, globalMean: number): number {
  return (reviewCount / (reviewCount + BAYESIAN_M)) * rating +
         (BAYESIAN_M / (reviewCount + BAYESIAN_M)) * globalMean;
}

// Normalize review count growth to 0-1 (50+ new reviews = max)
function growthScore(delta: number): number {
  return Math.min(Math.max(delta, 0) / 50, 1);
}

// Log-normalized popularity: rewards places everyone has heard of
function popularityScore(reviewCount: number): number {
  if (reviewCount <= 0) return 0;
  return Math.min(Math.log10(reviewCount) / Math.log10(POPULARITY_MAX_REVIEWS), 1);
}

/**
 * Hidden gems scoring: prioritise AI-assessed uniqueness and penalise
 * mainstream popularity — fewer reviews is a feature, not a bug.
 */
export function scoreHiddenGems(places: AnalyzedPlace[]): ScoredPlace[] {
  const filtered = places.filter((p) => !p.redFlag && p.rating >= 4.3 && p.reviewCount >= 30);

  const globalMean = filtered.length > 0
    ? filtered.reduce((sum, p) => sum + p.rating, 0) / filtered.length
    : 4.5;

  // Obscurity bonus: 800 reviews = 0 pts, 30 reviews = full 20 pts (log-inverse)
  function obscurityScore(reviewCount: number): number {
    const capped = Math.min(Math.max(reviewCount, 30), 800);
    return (1 - Math.log10(capped) / Math.log10(800)) * 20;
  }

  return filtered
    .map((p) => {
      // Quality: 40 pts — still need a genuinely good place
      const bRating = bayesianRating(p.rating, p.reviewCount, globalMean);
      const quality = (bRating / 5) * 40;

      // Uniqueness: 30 pts — the core signal for hidden gems
      const uniqueness = (p.uniqueness / 10) * 30;

      // Appeal: 10 pts — AI-assessed local appeal
      const appeal = (p.appeal / 10) * 10;

      // Obscurity: 20 pts — rewards places fewer people know about
      const obscurity = obscurityScore(p.reviewCount);

      const score = Math.round(quality + uniqueness + appeal + obscurity);

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function scorePlaces(places: AnalyzedPlace[]): ScoredPlace[] {
  const filtered = places.filter((p) => !p.redFlag && p.rating >= 3.5 && p.reviewCount >= 200);

  // Global mean rating across the filtered set
  const globalMean = filtered.length > 0
    ? filtered.reduce((sum, p) => sum + p.rating, 0) / filtered.length
    : 4.0;

  return filtered
    .map((p) => {
      // Quality: 70 pts — Bayesian-adjusted rating (primary signal)
      const bRating = bayesianRating(p.rating, p.reviewCount, globalMean);
      const quality = (bRating / 5) * 70;

      // Popularity: 10 pts — log-scaled review count ("how mainstream is this place")
      const popularity = popularityScore(p.reviewCount) * 10;

      // Growth: 10 pts — recent momentum
      const growth = growthScore(p.reviewCountDelta) * 10;

      // Semantic: 10 pts — AI uniqueness + appeal (tiebreaker only)
      const semantic = ((p.uniqueness + p.appeal) / 20) * 10;

      const score = Math.round(quality + popularity + growth + semantic);

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

import { AnalyzedPlace, ScoredPlace } from "./types";

// Normalize to 0-1 with log scale for review count
function reviewCountScore(n: number): number {
  return Math.min(Math.log10(n + 1) / Math.log10(5000), 1);
}

// Normalize review count growth to 0-1 (50+ new reviews = max)
function growthScore(delta: number): number {
  return Math.min(Math.max(delta, 0) / 50, 1);
}

export function scorePlaces(places: AnalyzedPlace[]): ScoredPlace[] {
  return places
    .filter((p) => !p.redFlag && p.rating >= 3.5)
    .map((p) => {
      // Quality: 40 pts — rating × review volume
      const quality = (p.rating / 5) * reviewCountScore(p.reviewCount) * 40;

      // Growth: 20 pts — recent momentum
      const growth = growthScore(p.reviewCountDelta) * 20;

      // Semantic: 40 pts — AI uniqueness + appeal
      const semantic = ((p.uniqueness + p.appeal) / 20) * 40;

      const score = Math.round(quality + growth + semantic);

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);
}

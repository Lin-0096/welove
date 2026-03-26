export interface CuratedPlace {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  score: number;
  reason: string;
  rank: number;
  weeklyHours: string[];
  specialDays: string[];
}

export interface GrowthEntry {
  placeId: string;
  name: string;
  currentRating: number;
  currentReviewCount: number;
  reviewCountDelta: number;
  ratingDelta: number;
}

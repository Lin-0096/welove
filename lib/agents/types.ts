export interface PlaceInput {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  address: string;
  lat: number;
  lng: number;
  reviewCountDelta: number;
  ratingDelta: number;
}

export interface AnalyzedPlace extends PlaceInput {
  uniqueness: number;        // 1-10: how distinctive vs generic chain
  appeal: number;            // 1-10: would you recommend to a friend
  tags: string[];
  redFlag: boolean;          // tourist trap or low-quality chain
  layoverScore: number;      // 1-10: how suitable for a short layover visit
  stayMinutesOverride: number | null; // null = use type default
}

export interface ScoredPlace extends AnalyzedPlace {
  score: number; // 0-100
}

export interface CuratedEntry {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  score: number;
  reason: string;
  reasonFi: string;
  reasonZh: string;
  rank: number;
}

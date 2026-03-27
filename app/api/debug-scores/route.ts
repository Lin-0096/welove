import { NextRequest, NextResponse } from "next/server";
import { getCity } from "@/lib/cities";
import { getCategoryPlaces, PlaceCategory } from "@/lib/google-places";

const BAYESIAN_M = 300;
const MIN_REVIEWS = 200;

function bayesianRating(rating: number, reviewCount: number, globalMean: number): number {
  return (reviewCount / (reviewCount + BAYESIAN_M)) * rating +
         (BAYESIAN_M / (reviewCount + BAYESIAN_M)) * globalMean;
}

function growthScore(delta: number): number {
  return Math.min(Math.max(delta, 0) / 50, 1);
}

const VALID_CATEGORIES: PlaceCategory[] = ["cafe", "bar", "restaurant"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const citySlug = searchParams.get("city") ?? "helsinki";
  const category = (searchParams.get("category") ?? "restaurant") as PlaceCategory;

  const city = getCity(citySlug);
  if (!city) return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const rawPlaces = await getCategoryPlaces(city, category);

  const eligible = rawPlaces.filter((p) => p.rating >= 3.5 && p.reviewCount >= MIN_REVIEWS);
  const tooFewReviews = rawPlaces.filter((p) => p.rating >= 3.5 && p.reviewCount < MIN_REVIEWS);
  const lowRating = rawPlaces.filter((p) => p.rating < 3.5);

  const globalMean =
    eligible.length > 0
      ? eligible.reduce((sum, p) => sum + p.rating, 0) / eligible.length
      : 4.0;

  // Score without AI (uniqueness=5, appeal=5 as defaults)
  const DEFAULT_UNIQUENESS = 5;
  const DEFAULT_APPEAL = 5;

  const scored = eligible
    .map((p) => {
      const bRating = bayesianRating(p.rating, p.reviewCount, globalMean);
      const quality = (bRating / 5) * 80;
      const growth = growthScore(0) * 10; // no snapshot delta available here
      const semantic = ((DEFAULT_UNIQUENESS + DEFAULT_APPEAL) / 20) * 10;
      const score = Math.round(quality + growth + semantic);
      return {
        name: p.name,
        rating: p.rating,
        reviewCount: p.reviewCount,
        bRating: Math.round(bRating * 1000) / 1000,
        quality: Math.round(quality * 10) / 10,
        semantic,
        score,
        status: "eligible" as const,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const filteredPlaces = tooFewReviews
    .map((p) => ({
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      bRating: null,
      quality: null,
      semantic: null,
      score: null,
      rank: null,
      status: "filtered_reviews" as const,
    }))
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);

  const lowRatingPlaces = lowRating.map((p) => ({
    name: p.name,
    rating: p.rating,
    reviewCount: p.reviewCount,
    bRating: null,
    quality: null,
    semantic: null,
    score: null,
    rank: null,
    status: "filtered_rating" as const,
  }));

  return NextResponse.json({
    city: citySlug,
    category,
    globalMean: Math.round(globalMean * 1000) / 1000,
    minReviews: MIN_REVIEWS,
    bayesianM: BAYESIAN_M,
    note: "AI scores not applied here (uniqueness=5, appeal=5 defaults). Growth=0 (no snapshot delta). Selector AI re-ranks top candidates — final ranking may differ.",
    places: [...scored, ...filteredPlaces, ...lowRatingPlaces],
  });
}

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { OpeningHours } from "./OpeningHours";

interface CuratedPlace {
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

interface Props {
  citySlug: string;
}

function rankClass(rank: number): string {
  if (rank === 1) return "text-amber-500 font-bold";
  if (rank === 2) return "text-zinc-400 font-bold";
  if (rank === 3) return "text-amber-700/60 font-bold";
  return "text-muted-foreground/30 font-medium";
}

const TYPE_COLORS: Record<string, string> = {
  cafe: "bg-amber-50 text-amber-700 border-amber-200",
  coffee_shop: "bg-amber-50 text-amber-700 border-amber-200",
  bar: "bg-blue-50 text-blue-700 border-blue-200",
  pub: "bg-blue-50 text-blue-700 border-blue-200",
  irish_pub: "bg-blue-50 text-blue-700 border-blue-200",
  cocktail_bar: "bg-indigo-50 text-indigo-700 border-indigo-200",
  wine_bar: "bg-purple-50 text-purple-700 border-purple-200",
  brewery: "bg-orange-50 text-orange-700 border-orange-200",
  restaurant: "bg-rose-50 text-rose-700 border-rose-200",
  bakery: "bg-yellow-50 text-yellow-700 border-yellow-200",
  sauna: "bg-red-50 text-red-700 border-red-200",
};

const TAG_COLORS: Record<string, string> = {
  "Hidden Gem": "bg-violet-50 text-violet-700 border-violet-200",
  "Local Favorite": "bg-sky-50 text-sky-700 border-sky-200",
  "Must Visit": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function tagClass(tag: string, primaryType: string): string {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  return TYPE_COLORS[primaryType] ?? "bg-muted text-muted-foreground border-border";
}

export function CuratedList({ citySlug }: Props) {
  const [places, setPlaces] = useState<CuratedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/curated?city=${citySlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaces(data.places);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [citySlug]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  if (places.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No curated list yet</p>
        <p className="text-sm mt-2">
          The AI curation runs daily after the snapshot. Check back tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {places.map((place) => (
        <CuratedCard key={place.placeId} place={place} />
      ))}
    </div>
  );
}

function deriveTags(place: CuratedPlace): string[] {
  const typeMap: Record<string, string> = {
    cafe: "Café", coffee_shop: "Coffee", bar: "Bar", restaurant: "Restaurant",
    sauna: "Sauna", bakery: "Bakery", brewery: "Brewery", wine_bar: "Wine Bar",
    night_club: "Club", food: "Food", meal_takeaway: "Takeaway",
    pub: "Pub", irish_pub: "Irish Pub", cocktail_bar: "Cocktail Bar",
    hamburger_restaurant: "Burgers", pizza_restaurant: "Pizza",
    vietnamese_restaurant: "Vietnamese", eastern_european_restaurant: "Eastern European",
    seafood_restaurant: "Seafood", sushi_restaurant: "Sushi", ramen_restaurant: "Ramen",
    chinese_restaurant: "Chinese", japanese_restaurant: "Japanese", indian_restaurant: "Indian",
    thai_restaurant: "Thai", mexican_restaurant: "Mexican", italian_restaurant: "Italian",
    museum: "Museum", church: "Church", castle: "Castle", hotel: "Hotel",
    food_store: "Food Shop", city_park: "Park", botanical_garden: "Garden",
    sports_activity_location: "Activity", tourist_attraction: "Attraction",
    nature_preserve: "Nature", amusement_center: "Amusement", event_venue: "Venue",
  };

  const typeLabel = typeMap[place.primaryType] ?? place.primaryType.replace(/_/g, " ");

  const tags: string[] = [];
  if (typeLabel.trim()) tags.push(typeLabel);

  if (place.reviewCount <= 300) tags.push("Hidden Gem");
  else if (place.reviewCount <= 1000) tags.push("Local Favorite");

  if (place.score >= 65) tags.push("Must Visit");

  return tags;
}

function CuratedCard({ place }: { place: CuratedPlace }) {
  const tags = deriveTags(place);

  return (
    <div className="flex items-start gap-3 px-3 py-3.5 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
      <span className={`text-base leading-none shrink-0 w-6 mt-0.5 ${rankClass(place.rank)}`}>
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{place.name}</h3>
          <span className="text-xs text-muted-foreground shrink-0">
            {place.rating.toFixed(1)}★ · {place.reviewCount.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`text-xs px-1.5 py-0 font-normal ${tagClass(tag, place.primaryType)}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1 mt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/60 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-destructive">
      <p className="font-medium">Failed to load curated list</p>
      <p className="text-sm mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CuratedPlace } from "@/lib/types";
import { rankClass } from "@/lib/rank";
import { OpeningHours } from "./OpeningHours";

interface Props {
  citySlug: string;
}

const HIGHLIGHTED_TAGS = new Set(["Must Visit"]);

function tagClass(tag: string): string {
  if (HIGHLIGHTED_TAGS.has(tag)) {
    return "bg-status-highlight-bg text-status-highlight-fg border-foreground/15 font-medium";
  }
  return "text-muted-foreground border-border/60";
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
      <div className="py-16 text-muted-foreground">
        <p className="text-lg font-medium">No curated list yet</p>
        <p className="text-sm mt-2">
          Our picks are updated daily. Check back tomorrow.
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
      <span className={`font-display font-black text-xl leading-none shrink-0 w-7 mt-0.5 tabular-nums ${rankClass(place.rank)}`}>
        {place.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg leading-tight">{place.name}</h3>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            <span aria-label={`Rated ${place.rating.toFixed(1)} out of 5`}>
              {place.rating.toFixed(1)}★
            </span>
            {" · "}{place.reviewCount.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`text-xs px-1.5 py-0 ${tagClass(tag)}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-base text-foreground/75 mt-1.5 leading-snug">{place.reason}</p>
        <OpeningHours weeklyHours={place.weeklyHours} specialDays={place.specialDays} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading places" className="space-y-1 mt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/60 motion-safe:animate-pulse rounded-lg" aria-hidden="true" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-destructive">
      <p className="font-medium">Failed to load curated list</p>
      <p className="text-sm mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

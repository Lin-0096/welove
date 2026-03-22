"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CuratedPlace {
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  primaryType: string;
  score: number;
  reason: string;
  rank: number;
}

interface Props {
  citySlug: string;
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
    <div className="grid gap-3">
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

  if (place.reviewCount <= 80) tags.push("Hidden Gem");
  else if (place.reviewCount <= 250) tags.push("Local Favorite");

  if (place.score >= 80) tags.push("Must Visit");

  return tags;
}

function CuratedCard({ place }: { place: CuratedPlace }) {
  const tags = deriveTags(place);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl font-bold text-muted-foreground/40 leading-none shrink-0 w-7">
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
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-foreground/80 mt-1.5 leading-snug">{place.reason}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 mt-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
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

import { Place } from "@/lib/google-places";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OpeningHours } from "./OpeningHours";

interface Props {
  place: Place;
  rank?: number;
}

function formatType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-500">★</span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
    </span>
  );
}

export function PlaceCard({ place, rank }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {rank !== undefined && (
              <span className="text-2xl font-bold text-muted-foreground/40 leading-none shrink-0 w-7">
                {rank}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">{place.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{place.address}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StarRating rating={place.rating} />
            <span className="text-xs text-muted-foreground">
              {place.reviewCount.toLocaleString()} reviews
            </span>
          </div>
        </div>

        <div className="mt-2">
          {place.primaryType && (
            <Badge variant="outline" className="text-xs">
              {formatType(place.primaryType)}
            </Badge>
          )}
        </div>

        <OpeningHours
          isOpenNow={place.isOpenNow}
          todayHours={place.todayHours}
          weeklyHours={place.weeklyHours}
        />
      </CardContent>
    </Card>
  );
}

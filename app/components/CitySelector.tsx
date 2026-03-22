"use client";

import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/cities";

interface Props {
  currentSlug: string;
}

export function CitySelector({ currentSlug }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.values(CITIES).map((city) => (
        <button
          key={city.slug}
          onClick={() => router.push(`/${city.slug}`)}
          className={[
            "px-3 py-1 rounded-full text-sm font-medium transition-colors",
            city.slug === currentSlug
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/70",
          ].join(" ")}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}

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
            "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
            city.slug === currentSlug
              ? "bg-foreground text-background shadow-sm"
              : "bg-card text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30",
          ].join(" ")}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}

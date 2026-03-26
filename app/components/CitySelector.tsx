"use client";

import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/cities";

interface Props {
  currentSlug: string;
}

export function CitySelector({ currentSlug }: Props) {
  const router = useRouter();

  return (
    <nav aria-label="Select city" className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-0.5">
      {Object.values(CITIES).map((city) => (
        <button
          key={city.slug}
          onClick={() => router.push(`/${city.slug}`)}
          aria-current={city.slug === currentSlug ? "page" : undefined}
          className={[
            "px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-colors shrink-0 whitespace-nowrap",
            city.slug === currentSlug
              ? "bg-brand text-brand-foreground shadow-sm"
              : "bg-card text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30",
          ].join(" ")}
        >
          {city.name}
        </button>
      ))}
    </nav>
  );
}

"use client";

import { useState } from "react";
import { Coffee, Wine, Utensils, Heart, Gem } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceList } from "./PlaceList";
import { CuratedList } from "./CuratedList";
import { WeatherWidget } from "./WeatherWidget";
import { LayoverTimer } from "./LayoverTimer";
import { LayoverPlanner } from "./LayoverPlanner";
import { type CityConfig } from "@/lib/cities";
import { getT, type Locale } from "@/lib/i18n";

interface Props {
  city: CityConfig;
  locale: Locale;
}

export function ModeController({ city, locale }: Props) {
  const t = getT(locale);
  const [availableMinutes, setAvailableMinutes] = useState<number | null>(null);
  const isLayoverMode = availableMinutes !== null && availableMinutes > 30;

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <WeatherWidget city={city} locale={locale} />
        <LayoverTimer
          backByLabel={t.backBy}
          tomorrowLabel={t.tomorrow}
          clearLabel={t.clearLayover}
          countdownLabel={t.timeRemaining}
          onMinutesChange={setAvailableMinutes}
        />
      </div>

      {isLayoverMode ? (
        <LayoverPlanner
          citySlug={city.slug}
          locale={locale}
          availableMinutes={availableMinutes!}
        />
      ) : (
        <div className="mt-8">
          <Tabs defaultValue="cafe">
            <TabsList
              variant="line"
              className="w-full mb-6 gap-0 border-b border-border rounded-none"
            >
              <TabsTrigger
                value="cafe"
                className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm"
              >
                <Coffee className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.cafe}</span>
              </TabsTrigger>
              <TabsTrigger
                value="bar"
                className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm"
              >
                <Wine className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.bar}</span>
              </TabsTrigger>
              <TabsTrigger
                value="restaurant"
                className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm"
              >
                <Utensils className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.restaurant}</span>
              </TabsTrigger>
              <TabsTrigger
                value="curated"
                className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm"
              >
                <Heart className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.curated}</span>
              </TabsTrigger>
              {city.slug === "helsinki" && (
                <TabsTrigger
                  value="hidden-gems"
                  className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm"
                >
                  <Gem className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="max-[479px]:sr-only">{t.tabs.hiddenGems}</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="cafe">
              <SectionHeader title={t.sections.cafe.title(city.name)} subtitle={t.sections.cafe.sub} />
              <PlaceList category="cafe" citySlug={city.slug} locale={locale} />
            </TabsContent>

            <TabsContent value="bar">
              <SectionHeader title={t.sections.bar.title(city.name)} subtitle={t.sections.bar.sub} />
              <PlaceList category="bar" citySlug={city.slug} locale={locale} />
            </TabsContent>

            <TabsContent value="restaurant">
              <SectionHeader title={t.sections.restaurant.title(city.name)} subtitle={t.sections.restaurant.sub} />
              <PlaceList category="restaurant" citySlug={city.slug} locale={locale} />
            </TabsContent>

            <TabsContent value="curated">
              <SectionHeader title={t.sections.curated.title(city.name)} subtitle={t.sections.curated.sub} />
              <CuratedList citySlug={city.slug} locale={locale} />
            </TabsContent>

            {city.slug === "helsinki" && (
              <TabsContent value="hidden-gems">
                <SectionHeader
                  title={t.sections.hiddenGems.title(city.name)}
                  subtitle={t.sections.hiddenGems.sub}
                />
                <CuratedList citySlug={city.slug} locale={locale} endpoint="/api/hidden-gems" />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl font-bold tracking-tight leading-tight">{title}</h2>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

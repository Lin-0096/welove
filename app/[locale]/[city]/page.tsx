import { notFound } from "next/navigation";
import { Coffee, Wine, Utensils, Heart, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceList } from "../../components/PlaceList";
import { CuratedList } from "../../components/CuratedList";
import { CitySelector } from "../../components/CitySelector";
import { WeatherWidget } from "../../components/WeatherWidget";
import { LayoverTimer } from "../../components/LayoverTimer";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { getCity, CITY_SLUGS } from "@/lib/cities";
import { getT, isValidLocale, LOCALES, type Locale } from "@/lib/i18n";

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    CITY_SLUGS.map((city) => ({ locale, city }))
  );
}

interface Props {
  params: Promise<{ locale: string; city: string }>;
}

export default async function CityPage({ params }: Props) {
  const { locale: localeParam, city: citySlug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const city = getCity(citySlug);
  if (!city) notFound();

  const t = getT(locale);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-brand-foreground focus:rounded focus:text-sm focus:font-medium focus:shadow-lg"
      >
        {t.skipToContent}
      </a>
      <main id="main" className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8">
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">
                {city.name}
              </p>
              <LanguageSwitcher currentLocale={locale} />
            </div>
            <h1 className="font-display text-4xl min-[375px]:text-5xl font-black uppercase tracking-tight leading-none">
              {t.bestPlaces}
            </h1>
            <p className="text-sm text-muted-foreground mt-3">
              {t.subtitle(city.name)}
            </p>
            <div className="mt-5">
              <CitySelector currentSlug={city.slug} locale={locale} />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <WeatherWidget city={city} locale={locale} />
              <LayoverTimer backByLabel={t.backBy} tomorrowLabel={t.tomorrow} />
            </div>
          </div>

          <Tabs defaultValue="cafe">
            <TabsList
              variant="line"
              className="w-full mb-6 gap-0 border-b border-border rounded-none"
            >
              <TabsTrigger value="cafe" className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm">
                <Coffee className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.cafe}</span>
              </TabsTrigger>
              <TabsTrigger value="bar" className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm">
                <Wine className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.bar}</span>
              </TabsTrigger>
              <TabsTrigger value="restaurant" className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm">
                <Utensils className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.restaurant}</span>
              </TabsTrigger>
              <TabsTrigger value="curated" className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm">
                <Heart className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="max-[479px]:sr-only">{t.tabs.curated}</span>
              </TabsTrigger>
              {city.slug === "helsinki" && (
                <TabsTrigger value="hidden-gems" className="flex-1 min-[480px]:gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[480px]:text-sm">
                  <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
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
                <SectionHeader title={t.sections.hiddenGems.title(city.name)} subtitle={t.sections.hiddenGems.sub} />
                <CuratedList citySlug={city.slug} locale={locale} endpoint="/api/hidden-gems" />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
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

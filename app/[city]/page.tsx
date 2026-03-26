import { notFound } from "next/navigation";
import { Coffee, Wine, Utensils, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceList } from "../components/PlaceList";
import { CuratedList } from "../components/CuratedList";
import { CitySelector } from "../components/CitySelector";
import { getCity } from "@/lib/cities";

interface Props {
  params: Promise<{ city: string }>;
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);

  if (!city) notFound();

  return (
    <main id="main" className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8">
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand mb-3">
            {city.name}
          </p>
          <h1 className="font-display text-4xl min-[375px]:text-5xl font-black uppercase tracking-tight leading-none">
            Best Places
          </h1>
          <p className="text-sm text-muted-foreground mt-3">
            The best spots in {city.name}, updated daily
          </p>
          <div className="mt-5">
            <CitySelector currentSlug={city.slug} />
          </div>
        </div>

        <Tabs defaultValue="cafe">
          <TabsList
            variant="line"
            className="w-full mb-6 gap-0 border-b border-border rounded-none"
          >
            <TabsTrigger value="cafe" className="flex-1 gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[375px]:text-sm">
              <Coffee className="size-3.5 shrink-0" aria-hidden="true" />Cafés
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex-1 gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[375px]:text-sm">
              <Wine className="size-3.5 shrink-0" aria-hidden="true" />Bars
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="flex-1 gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[375px]:text-sm">
              <Utensils className="size-3.5 shrink-0" aria-hidden="true" />Restaurants
            </TabsTrigger>
            <TabsTrigger value="curated" className="flex-1 gap-1 rounded-none px-1.5 pb-2.5 text-xs min-[375px]:text-sm">
              <Heart className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="max-[359px]:hidden">People Love</span>
              <span className="min-[360px]:hidden">Loved</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cafe">
            <SectionHeader title={`Top Cafés in ${city.name}`} subtitle="Highest rated cafés" />
            <PlaceList category="cafe" citySlug={city.slug} />
          </TabsContent>

          <TabsContent value="bar">
            <SectionHeader title={`Top Bars in ${city.name}`} subtitle="Highest rated bars" />
            <PlaceList category="bar" citySlug={city.slug} />
          </TabsContent>

          <TabsContent value="restaurant">
            <SectionHeader
              title={`Top Restaurants in ${city.name}`}
              subtitle="Highest rated restaurants"
            />
            <PlaceList category="restaurant" citySlug={city.slug} />
          </TabsContent>

          <TabsContent value="curated">
            <SectionHeader
              title={`People Love · ${city.name}`}
              subtitle="The best spots across all types — quality, vibe & uniqueness"
            />
            <CuratedList citySlug={city.slug} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
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

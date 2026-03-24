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
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {city.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight leading-none">Best Places</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Top-rated spots, curated daily by AI
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
            <TabsTrigger value="cafe" className="flex-1 gap-1.5 rounded-none px-2 pb-2.5">
              <Coffee className="size-3.5" />Cafés
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex-1 gap-1.5 rounded-none px-2 pb-2.5">
              <Wine className="size-3.5" />Bars
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="flex-1 gap-1.5 rounded-none px-2 pb-2.5">
              <Utensils className="size-3.5" />Restaurants
            </TabsTrigger>
            <TabsTrigger value="curated" className="flex-1 gap-1.5 rounded-none px-2 pb-2.5">
              <Heart className="size-3.5" />People Love
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
    <div className="mb-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}

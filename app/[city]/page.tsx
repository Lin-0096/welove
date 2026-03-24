import { notFound } from "next/navigation";
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
          <h1 className="text-4xl font-bold tracking-tight leading-none">Best Places</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Top-rated spots, curated daily by AI
          </p>
          <div className="mt-5">
            <CitySelector currentSlug={city.slug} />
          </div>
        </div>

        <Tabs defaultValue="cafe">
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-background border border-border shadow-sm">
            <TabsTrigger value="cafe">Cafés</TabsTrigger>
            <TabsTrigger value="bar">Bars</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
            <TabsTrigger value="curated" className="data-[state=active]:text-amber-700">
              People Love
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
    <div className="mb-5 pb-4 border-b border-border">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-3">Best Places</h1>
          <CitySelector currentSlug={city.slug} />
        </div>

        <Tabs defaultValue="cafe">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="cafe">Coffee</TabsTrigger>
            <TabsTrigger value="bar">Bars</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
            <TabsTrigger value="curated">People Love</TabsTrigger>
          </TabsList>

          <TabsContent value="cafe">
            <SectionHeader title={`Top Coffee in ${city.name}`} subtitle="Highest rated cafes" />
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
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

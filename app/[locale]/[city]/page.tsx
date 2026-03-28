import { notFound } from "next/navigation";
import { CitySelector } from "../../components/CitySelector";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ModeController } from "../../components/ModeController";
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
          </div>

          <ModeController city={city} locale={locale} />
        </div>
      </main>
    </>
  );
}

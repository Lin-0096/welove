export interface CityConfig {
  slug: string;
  name: string;
  center: { latitude: number; longitude: number };
  radius: number; // meters
}

export const CITIES: Record<string, CityConfig> = {
  helsinki: {
    slug: "helsinki",
    name: "Helsinki",
    center: { latitude: 60.1699, longitude: 24.9384 },
    radius: 25000, // covers Helsinki + Espoo metro area
  },
  tampere: {
    slug: "tampere",
    name: "Tampere",
    center: { latitude: 61.4978, longitude: 23.7610 },
    radius: 8000,
  },
  turku: {
    slug: "turku",
    name: "Turku",
    center: { latitude: 60.4518, longitude: 22.2666 },
    radius: 7000,
  },
  espoo: {
    slug: "espoo",
    name: "Espoo",
    center: { latitude: 60.2052, longitude: 24.6522 },
    radius: 8000,
  },
  oulu: {
    slug: "oulu",
    name: "Oulu",
    center: { latitude: 65.0121, longitude: 25.4651 },
    radius: 7000,
  },
};

export const CITY_SLUGS = Object.keys(CITIES);

export function getCity(slug: string): CityConfig | null {
  return CITIES[slug.toLowerCase()] ?? null;
}

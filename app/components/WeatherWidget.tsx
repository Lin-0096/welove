"use client";

import { useEffect, useState } from "react";
import type { CityConfig } from "@/lib/cities";
import { WMO_LABELS, getT, type Locale } from "@/lib/i18n";

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

// Module-level cache: 10-minute TTL keyed by city slug.
// Prevents re-fetching on every tab switch / remount.
const cache = new Map<string, { data: WeatherData; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

interface Props {
  city: CityConfig;
  locale: Locale;
}

export function WeatherWidget({ city, locale }: Props) {
  const cached = cache.get(city.slug);
  const hasValid = cached && Date.now() - cached.ts < CACHE_TTL;

  const [weather, setWeather] = useState<WeatherData | null>(hasValid ? cached.data : null);

  useEffect(() => {
    const hit = cache.get(city.slug);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setWeather(hit.data);
      return;
    }

    const controller = new AbortController();
    const { latitude, longitude } = city.center;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        const weather: WeatherData = {
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
        };
        cache.set(city.slug, { data: weather, ts: Date.now() });
        setWeather(weather);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Weather fetch failed", err);
      });
    return () => controller.abort();
  }, [city.slug]);

  if (!weather) {
    return (
      <span className="block min-h-[1.25rem]" role="status">
        <span className="sr-only">{getT(locale).loadingWeather}</span>
      </span>
    );
  }

  const label = WMO_LABELS[locale][weather.weatherCode] ?? "—";

  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{weather.temperature}°C</span>
      {" · "}
      {label}
    </span>
  );
}

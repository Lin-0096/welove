"use client";

import { useEffect, useState } from "react";
import type { CityConfig } from "@/lib/cities";
import { WMO_LABELS, type Locale } from "@/lib/i18n";

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

interface Props {
  city: CityConfig;
  locale: Locale;
}

export function WeatherWidget({ city, locale }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { latitude, longitude } = city.center;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Weather fetch failed", err);
      });
    return () => controller.abort();
  }, [city.slug]);

  if (!weather) {
    return (
      <span className="block min-h-[1.25rem]" role="status">
        <span className="sr-only">Loading weather…</span>
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

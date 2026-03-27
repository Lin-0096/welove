"use client";

import { useEffect, useState } from "react";
import type { CityConfig } from "@/lib/cities";

const WMO_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains",
  80: "Showers", 81: "Rain showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
};

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

export function WeatherWidget({ city }: { city: CityConfig }) {
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

  if (!weather) return <span className="block min-h-[1.25rem]" aria-hidden="true" />;

  const label = WMO_LABELS[weather.weatherCode] ?? "—";

  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{weather.temperature}°C</span>
      {" · "}
      {label}
    </span>
  );
}

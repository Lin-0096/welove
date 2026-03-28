const MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

// Helsinki-Vantaa Airport (EFHK)
const AIRPORT_LAT = 60.3172;
const AIRPORT_LNG = 24.9633;

/**
 * Returns transit travel time in minutes from Helsinki-Vantaa Airport
 * to the given coordinates, using Google Maps Distance Matrix API.
 * Falls back to a distance-based estimate if the API call fails.
 */
export async function getTransitMinutesFromAirport(
  lat: number,
  lng: number
): Promise<number> {
  const origin = `${AIRPORT_LAT},${AIRPORT_LNG}`;
  const destination = `${lat},${lng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=transit&key=${MAPS_API_KEY}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Distance Matrix API error: ${res.status}`);
    const data = await res.json() as {
      rows: { elements: { status: string; duration: { value: number } }[] }[];
    };
    const element = data.rows?.[0]?.elements?.[0];
    if (element?.status === "OK") {
      return Math.round(element.duration.value / 60);
    }
  } catch (err) {
    console.warn("Distance Matrix API failed, using distance estimate", err);
  }

  // Fallback: Haversine distance → rough transit estimate
  return estimateTransitMinutes(lat, lng);
}

function estimateTransitMinutes(lat: number, lng: number): number {
  const dLat = (lat - AIRPORT_LAT) * (Math.PI / 180);
  const dLng = (lng - AIRPORT_LNG) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(AIRPORT_LAT * (Math.PI / 180)) *
      Math.cos(lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Rough estimate: 3 min/km by transit (Helsinki rail is fast)
  return Math.round(Math.max(distanceKm * 3, 20));
}

/**
 * Haversine walking distance in meters between two coordinates.
 * Used for citywalk clustering (no API needed).
 */
export function walkingDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

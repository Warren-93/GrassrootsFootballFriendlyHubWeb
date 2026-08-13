// Approximate geocoding for a UK postcode outward code (e.g. "SW1A"), via the
// free, keyless postcodes.io API. Used for SCR-FF-04's results map - resolving
// only the outward code (not the full postcode) matches the same precision
// already disclosed as text elsewhere in search results (see MatchDtos'
// TeamSummary.generalArea on the backend: "only a general area and a
// distance", never an exact location), so plotting a pin here reveals
// nothing beyond what the team name/badge card already shows.

const cache = new Map<string, { longitude: number; latitude: number } | null>();

export async function geocodeOutcode(outcode: string): Promise<{ longitude: number; latitude: number } | null> {
  const key = outcode.trim().toUpperCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const response = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(key)}`);
    if (!response.ok) {
      cache.set(key, null);
      return null;
    }
    const body = await response.json();
    const result = body?.result;
    if (typeof result?.longitude !== 'number' || typeof result?.latitude !== 'number') {
      cache.set(key, null);
      return null;
    }
    const coords = { longitude: result.longitude, latitude: result.latitude };
    cache.set(key, coords);
    return coords;
  } catch {
    cache.set(key, null);
    return null;
  }
}

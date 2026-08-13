// Precise geocoding for a full UK postcode, via the free, keyless postcodes.io
// API. Used to resolve a real longitude/latitude behind the scenes for
// location entry forms (create club, create team, add venue) - the user only
// ever types a postcode, never raw coordinates. Distinct from geocodeOutcode,
// which deliberately only resolves the outward code for the privacy-preserving
// results map.

export interface GeocodeResult {
  longitude: number;
  latitude: number;
  outcode: string;
}

export async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  const trimmed = postcode.trim();
  if (!trimmed) return null;

  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`);
    if (!response.ok) return null;
    const body = await response.json();
    const result = body?.result;
    if (typeof result?.longitude !== 'number' || typeof result?.latitude !== 'number') return null;
    return { longitude: result.longitude, latitude: result.latitude, outcode: result.outcode ?? '' };
  } catch {
    return null;
  }
}

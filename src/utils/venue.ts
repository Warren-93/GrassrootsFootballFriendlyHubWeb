import type { PitchSurface, VenueView } from '../api/types';

export const PITCH_SURFACE_LABEL: Record<PitchSurface, string> = {
  GRASS: 'Grass',
  THREE_G: '3G',
  FOUR_G: '4G',
  ASTRO: 'Astro',
  INDOOR: 'Indoor',
};

interface DirectionsTarget {
  latitude?: number | null;
  longitude?: number | null;
  postcode?: string | null;
  address?: string | null;
}

/**
 * A Google Maps directions link to a venue - the same format the API's
 * fixture confirmation emails use: exact coordinates when known, else the
 * postcode (else the address). Null when there's nothing to navigate to.
 */
export function directionsUrl(venue: DirectionsTarget): string | null {
  const base = 'https://www.google.com/maps/dir/?api=1&destination=';
  if (venue.latitude != null && venue.longitude != null) return `${base}${venue.latitude},${venue.longitude}`;
  const place = venue.postcode?.trim() || venue.address?.trim();
  return place ? `${base}${encodeURIComponent(place)}` : null;
}

/**
 * The venue to preselect when we host: the team's own default venue if it's
 * one of the club's, else the club's default, else the first one listed.
 */
export function defaultVenueId(venues: VenueView[], teamDefaultVenueId: string | null | undefined): string | null {
  if (teamDefaultVenueId && venues.some((v) => v.id === teamDefaultVenueId)) return teamDefaultVenueId;
  return (venues.find((v) => v.isDefault) ?? venues[0])?.id ?? null;
}

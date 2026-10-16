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
 * "Address, postcode" for display, leaving the postcode off when the address
 * already contains it (the API fills a missing postcode from the address).
 */
export function venueAddressLine(venue: { address?: string | null; postcode?: string | null }): string {
  const address = venue.address?.trim() ?? '';
  const postcode = venue.postcode?.trim() ?? '';
  const squash = (s: string) => s.replace(/\s+/g, '').toUpperCase();
  if (postcode && squash(address).includes(squash(postcode))) return address;
  return [address, postcode].filter(Boolean).join(', ');
}

/**
 * The venue to preselect when we host: the team's own default venue if it's
 * one of the club's, else the club's default, else the first one listed.
 */
export function defaultVenueId(venues: VenueView[], teamDefaultVenueId: string | null | undefined): string | null {
  if (teamDefaultVenueId && venues.some((v) => v.id === teamDefaultVenueId)) return teamDefaultVenueId;
  return (venues.find((v) => v.isDefault) ?? venues[0])?.id ?? null;
}

/**
 * The postcode to PATCH when a venue is edited. The API keeps the current
 * postcode on null and clears it on "", so an emptied field sends "" (when
 * there was one to clear) and an unchanged one sends null.
 */
export function postcodeForUpdate(entered: string, saved: string | null | undefined): string | null {
  const next = entered.trim();
  const current = saved?.trim() ?? '';
  if (next === current) return null;
  return next;
}

import { describe, expect, it } from 'vitest';
import { defaultVenueId, directionsUrl, venueAddressLine } from './venue';
import type { VenueView } from '../api/types';

function venue(id: string, isDefault = false): VenueView {
  return {
    id,
    clubId: 'club-1',
    name: `Venue ${id}`,
    address: '1 Park Road',
    longitude: -0.1,
    latitude: 51,
    pitchSurface: null,
    facilities: [],
    accessNotes: null,
    parkingNotes: null,
    pitchNumber: null,
    isDefault,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

describe('directionsUrl', () => {
  it('uses the coordinates when the venue has them', () => {
    expect(directionsUrl({ latitude: 51.0123, longitude: -0.1045, postcode: 'RH16 1AA' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=51.0123,-0.1045',
    );
  });

  it('falls back to the url-encoded postcode', () => {
    expect(directionsUrl({ latitude: null, longitude: null, postcode: 'RH16 1AA' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=RH16%201AA',
    );
  });

  it('falls back to the address when there is no postcode', () => {
    expect(directionsUrl({ postcode: '  ', address: '1 Park Road, Haywards Heath' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=1%20Park%20Road%2C%20Haywards%20Heath',
    );
  });

  it('returns null when there is nothing to navigate to', () => {
    expect(directionsUrl({ latitude: 51, longitude: null })).toBeNull();
  });
});

describe('defaultVenueId', () => {
  it("prefers the team's own default venue", () => {
    expect(defaultVenueId([venue('a', true), venue('b')], 'b')).toBe('b');
  });

  it("falls back to the club's default when the team's isn't one of the club's venues", () => {
    expect(defaultVenueId([venue('a'), venue('b', true)], 'gone')).toBe('b');
  });

  it('falls back to the first venue, or null when there are none', () => {
    expect(defaultVenueId([venue('a'), venue('b')], null)).toBe('a');
    expect(defaultVenueId([], 'b')).toBeNull();
  });
});

describe('venueAddressLine', () => {
  it('adds the postcode after the address', () => {
    expect(venueAddressLine({ address: '1 Park Road, Leeds', postcode: 'LS1 4AB' })).toBe('1 Park Road, Leeds, LS1 4AB');
  });

  it("doesn't repeat a postcode the address already has", () => {
    expect(venueAddressLine({ address: '1 Park Road, Leeds ls14ab', postcode: 'LS1 4AB' })).toBe('1 Park Road, Leeds ls14ab');
  });

  it('copes with either part missing', () => {
    expect(venueAddressLine({ address: null, postcode: 'LS1 4AB' })).toBe('LS1 4AB');
    expect(venueAddressLine({ address: '1 Park Road', postcode: null })).toBe('1 Park Road');
    expect(venueAddressLine({})).toBe('');
  });
});

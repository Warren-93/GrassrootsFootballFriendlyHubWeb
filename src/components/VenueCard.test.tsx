import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VenueCard } from './VenueCard';
import type { VenueSummary } from '../api/types';

const venue: VenueSummary = {
  id: 'v1',
  name: 'Riverside 3G Centre',
  address: '22 Mill Lane, Haywards Heath',
  postcode: 'RH16 3XY',
  pitchSurface: 'THREE_G',
  accessNotes: 'Use the side gate',
  parkingNotes: 'Free car park',
  latitude: 51.01,
  longitude: -0.11,
};

describe('VenueCard', () => {
  it('shows the venue details and a Google Maps directions link', () => {
    render(<VenueCard venue={venue} />);

    expect(screen.getByText('Riverside 3G Centre')).toBeInTheDocument();
    expect(screen.getByText('22 Mill Lane, Haywards Heath, RH16 3XY')).toBeInTheDocument();
    expect(screen.getByText('3G pitch')).toBeInTheDocument();
    expect(screen.getByText('Use the side gate')).toBeInTheDocument();
    expect(screen.getByText('Free car park')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Directions/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=51.01,-0.11',
    );
  });

  it('leaves out what the venue does not have', () => {
    render(
      <VenueCard
        venue={{ ...venue, address: null, postcode: null, pitchSurface: null, accessNotes: null, parkingNotes: null, latitude: null, longitude: null }}
      />,
    );

    expect(screen.getByText('Riverside 3G Centre')).toBeInTheDocument();
    expect(screen.queryByText('Access')).not.toBeInTheDocument();
    expect(screen.queryByText('Parking')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Directions/ })).not.toBeInTheDocument();
  });
});

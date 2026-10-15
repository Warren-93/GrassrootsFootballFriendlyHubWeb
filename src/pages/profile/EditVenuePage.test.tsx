import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditVenuePage } from './EditVenuePage';
import { AddVenuePage } from '../onboarding/AddVenuePage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { venueRepository } from '../../api/venueRepository';
import { geocodePostcode } from '../../lib/geocodePostcode';
import type { VenueView } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/venueRepository', () => ({
  venueRepository: { list: vi.fn(), create: vi.fn(), update: vi.fn(), setDefault: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../api/teamRepository', () => ({ teamRepository: { update: vi.fn().mockResolvedValue({ ok: true }) } }));
vi.mock('../../lib/geocodePostcode', () => ({ geocodePostcode: vi.fn() }));

const venue: VenueView = {
  id: 'v1',
  clubId: 'club-1',
  name: 'Victoria Park',
  address: '1 Park Road, Haywards Heath',
  postcode: 'RH16 1AA',
  longitude: -0.1,
  latitude: 51,
  pitchSurface: 'GRASS',
  facilities: [],
  accessNotes: null,
  parkingNotes: null,
  pitchNumber: null,
  isDefault: true,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('venue forms send the postcode', () => {
  beforeEach(() => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(venueRepository.list).mockResolvedValue({ ok: true, value: [venue] });
    vi.mocked(venueRepository.create).mockResolvedValue({ ok: true, value: venue });
    vi.mocked(venueRepository.update).mockResolvedValue({ ok: true, value: venue });
    vi.mocked(venueRepository.setDefault).mockResolvedValue({ ok: true, value: venue });
    vi.mocked(geocodePostcode).mockResolvedValue({ longitude: -0.1, latitude: 51, outcode: 'RH16' });
  });

  it('shows the saved postcode when editing a venue and sends it back', async () => {
    render(
      <MemoryRouter initialEntries={['/venues/v1/edit']}>
        <Routes>
          <Route path="/venues/:venueId/edit" element={<EditVenuePage />} />
          <Route path="/venues" element={<div>Venues list</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText('Postcode')).toHaveValue('RH16 1AA');
    await userEvent.click(screen.getByRole('button', { name: 'Save venue' }));

    expect(await screen.findByText('Venues list')).toBeInTheDocument();
    expect(venueRepository.update).toHaveBeenCalledWith('v1', expect.objectContaining({ postcode: 'RH16 1AA' }));
  });

  it('sends the postcode when adding the first venue during onboarding', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/add-venue', state: { teamId: 'team-1', clubId: 'club-1' } }]}>
        <Routes>
          <Route path="/add-venue" element={<AddVenuePage />} />
          <Route path="/add-availability" element={<div>Add availability</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Venue name'), 'Victoria Park');
    await userEvent.type(screen.getByLabelText('Address'), '1 Park Road, Haywards Heath');
    await userEvent.type(screen.getByLabelText('Postcode'), ' RH16 1AA {Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save venue' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Save venue' }));

    expect(await screen.findByText('Add availability')).toBeInTheDocument();
    expect(venueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clubId: 'club-1', name: 'Victoria Park', postcode: 'RH16 1AA' }),
    );
  });
});

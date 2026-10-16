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
    vi.clearAllMocks();
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

  function renderEdit() {
    return render(
      <MemoryRouter initialEntries={['/venues/v1/edit']}>
        <Routes>
          <Route path="/venues/:venueId/edit" element={<EditVenuePage />} />
          <Route path="/venues" element={<div>Venues list</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows the saved postcode when editing a venue and keeps it when unchanged', async () => {
    renderEdit();

    expect(await screen.findByLabelText('Postcode')).toHaveValue('RH16 1AA');
    await userEvent.click(screen.getByRole('button', { name: 'Save venue' }));

    expect(await screen.findByText('Venues list')).toBeInTheDocument();
    expect(venueRepository.update).toHaveBeenCalledWith('v1', expect.objectContaining({ postcode: null }));
  });

  it('sends a changed postcode with its new location', async () => {
    vi.mocked(geocodePostcode).mockResolvedValue({ longitude: -1.55, latitude: 53.8, outcode: 'LS1' });
    renderEdit();

    const field = await screen.findByLabelText('Postcode');
    await userEvent.clear(field);
    await userEvent.type(field, 'LS1 4AB{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save venue' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Save venue' }));

    expect(await screen.findByText('Venues list')).toBeInTheDocument();
    expect(venueRepository.update).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({ postcode: 'LS1 4AB', longitude: -1.55, latitude: 53.8 }),
    );
  });

  it('clears the postcode when it is emptied, keeping the venue where it is', async () => {
    renderEdit();

    await userEvent.clear(await screen.findByLabelText('Postcode'));
    expect(screen.getByText(/Keeping the existing location/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save venue' }));

    expect(await screen.findByText('Venues list')).toBeInTheDocument();
    expect(venueRepository.update).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({ postcode: '', longitude: -0.1, latitude: 51 }),
    );
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

describe('venue form for a team manager who is not the club admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage: true, canManageClub: false },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(venueRepository.list).mockResolvedValue({
      ok: true,
      value: [{ ...venue, accessNotes: 'Use the side gate' }],
    });
  });

  function renderAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/venues/new" element={<EditVenuePage />} />
          <Route path="/venues/:venueId/edit" element={<EditVenuePage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows the venue read-only, with no save or delete', async () => {
    renderAt('/venues/v1/edit');

    expect(await screen.findByText('Victoria Park')).toBeInTheDocument();
    expect(screen.getByText('Use the side gate')).toBeInTheDocument();
    expect(screen.getByText('Only your club admin can add or change venues.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Venue name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save venue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete venue' })).not.toBeInTheDocument();
  });

  it('says only the club admin can add a venue instead of showing the form', () => {
    renderAt('/venues/new');

    expect(screen.getByText('Only your club admin can add or change venues.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Venue name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save venue' })).not.toBeInTheDocument();
    expect(venueRepository.create).not.toHaveBeenCalled();
  });
});

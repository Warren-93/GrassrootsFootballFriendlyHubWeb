import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VenuesListPage } from './VenuesListPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import type { ActiveTeam } from '../../session/CurrentTeamContext';
import { venueRepository } from '../../api/venueRepository';
import type { VenueView } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/venueRepository', () => ({ venueRepository: { list: vi.fn(), setDefault: vi.fn() } }));
// jsdom can't draw the map.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

function venue(id: string, name: string, isDefault = false): VenueView {
  return {
    id,
    clubId: 'club-1',
    name,
    address: '1 Park Road',
    postcode: 'RH16 1AA',
    longitude: -0.1,
    latitude: 51,
    pitchSurface: 'GRASS',
    facilities: [],
    accessNotes: null,
    parkingNotes: null,
    pitchNumber: null,
    isDefault,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

function actAs(flags: Partial<ActiveTeam>) {
  vi.mocked(useCurrentTeam).mockReturnValue({
    active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', ...flags },
    setActive: vi.fn(),
    clear: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/venues']}>
      <Routes>
        <Route path="/venues" element={<VenuesListPage />} />
        <Route path="/venues/new" element={<div>Add venue form</div>} />
        <Route path="/venues/:venueId/edit" element={<div>Edit venue form</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VenuesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(venueRepository.list).mockResolvedValue({
      ok: true,
      value: [venue('v1', 'Victoria Park', true), { ...venue('v2', 'Riverside 3G Centre'), parkingNotes: 'Free car park' }],
    });
  });

  it('lets a club admin add, edit and make a venue the default', async () => {
    actAs({ canManage: true, canManageClub: true });
    renderPage();

    expect(await screen.findByText('Victoria Park')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add venue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Make default' })).toBeInTheDocument();
    expect(screen.queryByText('Only your club admin can add or change venues.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Riverside 3G Centre'));
    expect(await screen.findByText('Edit venue form')).toBeInTheDocument();
  });

  it('still offers everything when an older API leaves out whether they run the club', async () => {
    actAs({});
    renderPage();

    expect(await screen.findByText('Victoria Park')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add venue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Make default' })).toBeInTheDocument();
  });

  it("shows a team manager the club's venues read-only", async () => {
    actAs({ canManage: true, canManageClub: false });
    renderPage();

    expect(await screen.findByText('Victoria Park')).toBeInTheDocument();
    expect(screen.getByText('Riverside 3G Centre')).toBeInTheDocument();
    expect(screen.getByText('Parking: Free car park')).toBeInTheDocument();
    expect(screen.getByText('Only your club admin can add or change venues.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add venue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make default' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Riverside 3G Centre'));
    expect(screen.queryByText('Edit venue form')).not.toBeInTheDocument();
  });

  it('asks a team manager to get their club admin to add the first venue', async () => {
    vi.mocked(venueRepository.list).mockResolvedValue({ ok: true, value: [] });
    actAs({ canManage: true, canManageClub: false });
    renderPage();

    expect(await screen.findByText('Your club has no venues yet. Ask your club admin to add one.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add venue' })).not.toBeInTheDocument();
  });
});

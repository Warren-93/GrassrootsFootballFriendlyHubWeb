import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitationComposerPage } from './InvitationComposerPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { useInvitationDraftStore, useSearchResultsStore } from '../../session/SearchState';
import { teamRepository } from '../../api/teamRepository';
import { venueRepository } from '../../api/venueRepository';
import type { MatchSummary, SearchResponse, TeamView, VenueView } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/matchRepository', () => ({ matchRepository: { search: vi.fn() } }));
vi.mock('../../api/teamRepository', () => ({ teamRepository: { get: vi.fn() } }));
vi.mock('../../api/venueRepository', () => ({ venueRepository: { list: vi.fn() } }));

const match: MatchSummary = {
  team: {
    id: 'team-2',
    name: 'Haywards Heath Harriers',
    clubName: 'Harriers FC',
    badgeUrl: null,
    ageGroup: 'U12',
    gender: 'GIRLS',
    format: 'NINE_A_SIDE',
    abilityLevel: 'INTERMEDIATE',
    league: null,
    description: null,
    generalArea: 'RH16',
    verified: true,
  },
  score: 88,
  band: 'GREAT',
  milesApart: 3.2,
  reasons: [],
  factors: [],
  earliestOverlap: { date: '2026-11-07', startTime: '10:00:00', overlapMinutes: 120, ourSlotId: 'slot-1', theirSlotId: 'slot-2' },
  canReceiveRequests: true,
};

function venue(id: string, name: string, isDefault = false): VenueView {
  return {
    id,
    clubId: 'club-1',
    name,
    address: '1 Park Road',
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/invite/team-2']}>
      <Routes>
        <Route path="/invite/:teamId" element={<InvitationComposerPage />} />
        <Route path="/invite/review" element={<div>Review page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InvitationComposerPage venue', () => {
  beforeEach(() => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    useSearchResultsStore.setState({ response: { results: [match] } as SearchResponse });
    useInvitationDraftStore.setState({ draft: null });
    vi.mocked(teamRepository.get).mockResolvedValue({
      ok: true,
      value: { id: 'team-1', defaultVenueId: 'v2', readyForRequests: true } as TeamView,
    });
    vi.mocked(venueRepository.list).mockResolvedValue({
      ok: true,
      value: [venue('v1', 'Victoria Park', true), venue('v2', 'Riverside 3G Centre')],
    });
  });

  it("preselects the team's default venue when we host and sends it", async () => {
    renderPage();

    expect(await screen.findByText('Riverside 3G Centre')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Review invitation' }));

    expect(await screen.findByText('Review page')).toBeInTheDocument();
    expect(useInvitationDraftStore.getState().draft).toMatchObject({
      venueId: 'v2',
      venueName: 'Riverside 3G Centre',
      homeTeamId: 'team-1',
    });
  });

  it('sends a different venue when one is picked', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('combobox', { name: 'Venue' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Victoria Park' }));
    await userEvent.click(screen.getByRole('button', { name: 'Review invitation' }));

    expect(useInvitationDraftStore.getState().draft).toMatchObject({ venueId: 'v1', homeTeamId: 'team-1' });
  });

  it('says the match is at their home ground when they host, and sends no venue', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('combobox', { name: 'Home / away' }));
    await userEvent.click(await screen.findByRole('option', { name: 'They host' }));

    expect(screen.getByText(/the match will be at their home ground/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Venue' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Review invitation' }));
    expect(useInvitationDraftStore.getState().draft).toMatchObject({ venueId: null, homeTeamId: 'team-2' });
  });

  it("leaves the venue to the API when the club's venues can't be listed", async () => {
    vi.mocked(venueRepository.list).mockResolvedValue({ ok: false, message: 'That club could not be found.', status: 404 });
    renderPage();

    expect(await screen.findByText('You host - the match will be at your home ground.')).toBeInTheDocument();
    expect(screen.queryByText(/Your club has no venues yet/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Review invitation' }));
    expect(useInvitationDraftStore.getState().draft).toMatchObject({ venueId: null, venueName: null, homeTeamId: 'team-1' });
  });

  it("doesn't fall back to the home ground while the venues are still loading", async () => {
    vi.mocked(venueRepository.list).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(await screen.findByText("Loading your club's venues…")).toBeInTheDocument();
    expect(screen.queryByText('You host - the match will be at your home ground.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review invitation' })).toBeDisabled();
  });

  it('offers to add a venue when the club has none', async () => {
    vi.mocked(venueRepository.list).mockResolvedValue({ ok: true, value: [] });
    renderPage();

    expect(await screen.findByText(/Your club has no venues yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a venue' })).toBeInTheDocument();
  });
});

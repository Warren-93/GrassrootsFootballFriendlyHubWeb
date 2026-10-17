import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultsListPage } from './ResultsListPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { EMPTY_FILTERS, searchRequestFor, useSearchFilterStore, useSearchResultsStore } from '../../session/SearchState';
import { matchRepository } from '../../api/matchRepository';
import { teamRepository } from '../../api/teamRepository';
import type { SearchResponse } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/matchRepository', () => ({ matchRepository: { search: vi.fn() } }));
vi.mock('../../api/teamRepository', () => ({ teamRepository: { get: vi.fn() } }));

const response: SearchResponse = {
  searchId: 's1',
  totalResults: 1,
  nextCursor: null,
  weights: { age: 1, availability: 1, format: 1, distance: 1, homeAway: 1, ability: 1 },
  results: [
    {
      team: {
        id: 'team-2',
        name: 'Haywards Heath Harriers',
        clubName: 'Harriers FC',
        badgeUrl: null,
        ageGroup: 'U12',
        gender: 'GIRLS',
        format: 'NINE_A_SIDE',
        abilityLevel: 'DIVISION_2',
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
      earliestOverlap: null,
      canReceiveRequests: true,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/results']}>
      <ResultsListPage />
    </MemoryRouter>,
  );
}

describe('ResultsListPage', () => {
  beforeEach(() => {
    useSearchResultsStore.setState({ response: null });
    useSearchFilterStore.getState().setFilters({ verifiedOnly: true });
    vi.mocked(teamRepository.get).mockResolvedValue({ ok: false, message: 'not needed' });
    vi.mocked(matchRepository.search).mockReset();
  });

  it('runs the default search when opened with no search in memory', async () => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(matchRepository.search).mockResolvedValue({ ok: true, value: response });

    renderPage();

    expect(await screen.findByText('Haywards Heath Harriers')).toBeInTheDocument();
    expect(screen.queryByText('No search yet.')).not.toBeInTheDocument();
    expect(matchRepository.search).toHaveBeenCalledWith(searchRequestFor('team-1', EMPTY_FILTERS));
    expect(useSearchFilterStore.getState().verifiedOnly).toBe(false);
  });

  it('shows the error with a retry when the search fails', async () => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(matchRepository.search).mockResolvedValue({ ok: false, message: 'Something went wrong' });

    renderPage();

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it("doesn't search again when a search is already in memory", async () => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    useSearchResultsStore.setState({ response });

    renderPage();

    expect(await screen.findByText('Haywards Heath Harriers')).toBeInTheDocument();
    expect(matchRepository.search).not.toHaveBeenCalled();
  });
});

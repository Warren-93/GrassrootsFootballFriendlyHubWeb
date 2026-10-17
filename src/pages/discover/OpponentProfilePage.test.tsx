import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpponentProfilePage } from './OpponentProfilePage';
import { MatchExplanationPage } from './MatchExplanationPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { EMPTY_FILTERS, searchRequestFor, useSearchFilterStore, useSearchResultsStore } from '../../session/SearchState';
import { matchRepository } from '../../api/matchRepository';
import type { SearchResponse } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/matchRepository', () => ({ matchRepository: { search: vi.fn() } }));
vi.mock('../../api/conversationRepository', () => ({ conversationRepository: { start: vi.fn() } }));

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
        description: 'Friendly, well-organised squad.',
        generalArea: 'RH16',
        verified: true,
      },
      score: 88,
      band: 'GREAT',
      milesApart: 3.2,
      reasons: [],
      factors: [{ factor: 'AGE', label: 'Age group', weight: 1, ratio: 1, points: 20, ourValue: 'U12', theirValue: 'U12', reason: 'Same age group' }],
      earliestOverlap: null,
      canReceiveRequests: true,
    },
  ],
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/opponent/:teamId" element={<OpponentProfilePage />} />
        <Route path="/match-explanation/:teamId" element={<MatchExplanationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OpponentProfilePage opened directly', () => {
  beforeEach(() => {
    useSearchResultsStore.setState({ response: null });
    useSearchFilterStore.getState().setFilters({ verifiedOnly: true });
    vi.mocked(matchRepository.search).mockReset();
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('runs the default search before deciding the opponent is missing', async () => {
    vi.mocked(matchRepository.search).mockResolvedValue({ ok: true, value: response });

    renderAt('/opponent/team-2');

    expect(await screen.findByRole('heading', { name: 'Haywards Heath Harriers' })).toBeInTheDocument();
    expect(screen.queryByText(/isn't in your last search results/)).not.toBeInTheDocument();
    expect(matchRepository.search).toHaveBeenCalledWith(searchRequestFor('team-1', EMPTY_FILTERS));
    expect(useSearchFilterStore.getState().verifiedOnly).toBe(false);
  });

  it("says the opponent is missing only once the search hasn't found them", async () => {
    vi.mocked(matchRepository.search).mockResolvedValue({ ok: true, value: { ...response, totalResults: 0, results: [] } });

    renderAt('/opponent/team-2');

    expect(await screen.findByText("This opponent isn't in your last search results.")).toBeInTheDocument();
  });

  it('offers to try again when the search fails', async () => {
    vi.mocked(matchRepository.search)
      .mockResolvedValueOnce({ ok: false, message: 'Something went wrong' })
      .mockResolvedValueOnce({ ok: true, value: response });

    renderAt('/opponent/team-2');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Haywards Heath Harriers' })).toBeInTheDocument();
    expect(matchRepository.search).toHaveBeenCalledTimes(2);
  });

  it("doesn't search again when the opponent is in the search in memory", () => {
    useSearchResultsStore.setState({ response });

    renderAt('/opponent/team-2');

    expect(screen.getByRole('heading', { name: 'Haywards Heath Harriers' })).toBeInTheDocument();
    expect(matchRepository.search).not.toHaveBeenCalled();
  });

  it('runs the default search for "Why this match?" too', async () => {
    vi.mocked(matchRepository.search).mockResolvedValue({ ok: true, value: response });

    renderAt('/match-explanation/team-2');

    expect(await screen.findByText('Why Haywards Heath Harriers is a 88% match')).toBeInTheDocument();
    expect(screen.getByText('Same age group')).toBeInTheDocument();
  });
});

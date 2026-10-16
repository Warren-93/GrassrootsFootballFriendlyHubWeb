import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProfileChecklistCard } from './ProfileChecklistCard';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import type { ActiveTeam } from '../session/CurrentTeamContext';
import type { TeamView } from '../api/types';

vi.mock('../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));

const team = {
  id: 'team-1',
  clubId: 'club-1',
  name: 'Riverside U12 Girls',
  verification: 'NOT_STARTED',
  readyForRequests: false,
  profileChecklist: [
    { key: 'VERIFICATION', label: 'Get verified', done: false, requiredForRequests: true },
    { key: 'VENUE', label: 'Add a venue', done: false, requiredForRequests: true },
  ],
} as TeamView;

function renderCard(flags: Partial<ActiveTeam>, view: TeamView = team) {
  vi.mocked(useCurrentTeam).mockReturnValue({
    active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', ...flags },
    setActive: vi.fn(),
    clear: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<ProfileChecklistCard team={view} />} />
        <Route path="/venues/new" element={<div>Add venue form</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfileChecklistCard venue item', () => {
  it('sends a club admin to add a venue', async () => {
    renderCard({ canManage: true, canManageClub: true });

    expect(screen.getAllByRole('button', { name: 'Do it' })).toHaveLength(2);
    expect(screen.queryByText(/Ask your club admin/)).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Do it' })[1]);
    expect(await screen.findByText('Add venue form')).toBeInTheDocument();
  });

  it('asks a team manager to get their club admin to add one instead', () => {
    renderCard({ canManage: true, canManageClub: false });

    expect(screen.getByText('Add a venue')).toBeInTheDocument();
    expect(screen.getByText('Your club has no venues yet. Ask your club admin to add one.')).toBeInTheDocument();
    // Only verification is left for them to do.
    expect(screen.getAllByRole('button', { name: 'Do it' })).toHaveLength(1);
  });

  it('keeps the link when an older API leaves out whether they run the club', () => {
    renderCard({});

    expect(screen.getAllByRole('button', { name: 'Do it' })).toHaveLength(2);
  });

  it("goes by the team's own flag for a team in another club", () => {
    renderCard({ canManage: true, canManageClub: true }, { ...team, clubId: 'club-2', canManageClub: false });

    expect(screen.getByText('Your club has no venues yet. Ask your club admin to add one.')).toBeInTheDocument();
  });
});

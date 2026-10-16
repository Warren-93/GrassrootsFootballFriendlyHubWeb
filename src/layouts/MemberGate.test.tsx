import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberGate } from './MemberGate';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { fixtureRepository } from '../api/fixtureRepository';
import type { FixtureView } from '../api/types';

vi.mock('../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../api/fixtureRepository', () => ({ fixtureRepository: { list: vi.fn() } }));

function fixture(id: string, date: string, homeTeamId: string, venueName: string | null): FixtureView {
  const us = { id: 'team-1', name: 'Riverside U12 Girls', clubName: 'Riverside FC', venueId: null };
  const them = { id: 'team-2', name: 'Haywards Heath Harriers', clubName: 'Harriers FC', venueId: null };
  return {
    id,
    friendlyRequestId: `request-${id}`,
    homeTeam: homeTeamId === 'team-1' ? us : them,
    awayTeam: homeTeamId === 'team-1' ? them : us,
    date,
    startTime: '10:00:00',
    endTime: '11:30:00',
    venueId: null,
    status: 'CONFIRMED',
    costShare: 'SPLIT',
    refereeArrangement: 'NONE',
    venue: venueName
      ? { id: 'v1', name: venueName, address: null, postcode: null, pitchSurface: null, accessNotes: null, parkingNotes: null, latitude: null, longitude: null }
      : null,
  };
}

function renderGate(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MemberGate>
        <Routes>
          <Route path="/" element={<div>Manager home</div>} />
          <Route path="/fixtures" element={<div>Manager fixtures</div>} />
          <Route path="/fixtures/:fixtureId" element={<div>Fixture details</div>} />
        </Routes>
      </MemberGate>
    </MemoryRouter>,
  );
}

function actAs(canManage: boolean) {
  vi.mocked(useCurrentTeam).mockReturnValue({
    active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage },
    setActive: vi.fn(),
    clear: vi.fn(),
  });
}

describe('MemberGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fixtureRepository.list).mockResolvedValue({
      ok: true,
      value: [fixture('away', '2099-05-09', 'team-2', null), fixture('home', '2099-05-02', 'team-1', 'Victoria Park')],
    });
  });

  it("shows a member their team's upcoming fixtures, soonest first", async () => {
    actAs(false);
    renderGate('/');

    expect(screen.getByText("You're a member of Riverside U12 Girls")).toBeInTheDocument();
    const opponents = await screen.findAllByText('vs Haywards Heath Harriers');
    expect(opponents).toHaveLength(2);
    expect(fixtureRepository.list).toHaveBeenCalledWith('team-1');

    const [first, second] = screen.getAllByRole('button', { name: /vs Haywards Heath Harriers/ });
    expect(first).toHaveTextContent('Kick-off 10:00');
    expect(first).toHaveTextContent('Victoria Park');
    expect(first).toHaveTextContent('Home');
    expect(second).toHaveTextContent('Venue to be confirmed');
    expect(second).toHaveTextContent('Away');
    expect(screen.queryByText('Manager home')).not.toBeInTheDocument();
  });

  it("opens a fixture's details for a member", async () => {
    actAs(false);
    renderGate('/');

    const [first] = await screen.findAllByRole('button', { name: /vs Haywards Heath Harriers/ });
    await userEvent.click(first);

    expect(await screen.findByText('Fixture details')).toBeInTheDocument();
  });

  it.each(['/fixtures', '/fixtures/'])('keeps the manage-only fixtures list at %s behind the gate', async (path) => {
    actAs(false);
    renderGate(path);

    expect(screen.getByText("You're a member of Riverside U12 Girls")).toBeInTheDocument();
    expect(screen.queryByText('Manager fixtures')).not.toBeInTheDocument();
  });

  it('says so when the team has no fixtures coming up', async () => {
    actAs(false);
    vi.mocked(fixtureRepository.list).mockResolvedValue({ ok: true, value: [fixture('old', '2020-01-04', 'team-1', null)] });
    renderGate('/');

    expect(await screen.findByText(/No friendlies coming up/)).toBeInTheDocument();
  });

  it("says so when the team's fixtures can't be loaded", async () => {
    actAs(false);
    vi.mocked(fixtureRepository.list).mockResolvedValue({ ok: false, message: 'That team could not be found.', status: 404 });
    renderGate('/');

    expect(await screen.findByText(/fixtures couldn't be loaded/)).toBeInTheDocument();
    expect(screen.queryByText(/No friendlies coming up/)).not.toBeInTheDocument();
  });

  it('leaves managers on their own screens', () => {
    actAs(true);
    renderGate('/');

    expect(screen.getByText('Manager home')).toBeInTheDocument();
    expect(fixtureRepository.list).not.toHaveBeenCalled();
  });
});

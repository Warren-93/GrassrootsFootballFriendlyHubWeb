import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FixtureDetailPage } from './FixtureDetailPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { fixtureRepository } from '../../api/fixtureRepository';
import type { FixtureTeamView, FixtureView } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/fixtureRepository', () => ({ fixtureRepository: { get: vi.fn(), cancel: vi.fn() } }));
vi.mock('../../api/conversationRepository', () => ({ conversationRepository: { start: vi.fn() } }));

const fixture: FixtureView = {
  id: 'f1',
  friendlyRequestId: 'r1',
  homeTeam: {
    id: 'team-1',
    name: 'Riverside U12 Girls',
    clubName: 'Riverside FC',
    managerName: 'Sam Patel',
    contactPhone: '07700 900123',
    venueId: null,
  },
  awayTeam: { id: 'team-2', name: 'Haywards Heath Harriers', clubName: 'Harriers FC', managerName: null, contactPhone: null, venueId: null },
  date: '2026-11-07',
  startTime: '10:00:00',
  endTime: '11:30:00',
  venueId: null,
  status: 'CONFIRMED',
  costShare: 'SPLIT',
  refereeArrangement: 'NONE',
};

function renderPage(canManage: boolean, view: FixtureView = fixture) {
  vi.mocked(useCurrentTeam).mockReturnValue({
    active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage },
    setActive: vi.fn(),
    clear: vi.fn(),
  });
  vi.mocked(fixtureRepository.get).mockResolvedValue({ ok: true, value: view });
  return render(
    <MemoryRouter initialEntries={['/fixtures/f1']}>
      <Routes>
        <Route path="/fixtures/:fixtureId" element={<FixtureDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FixtureDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gives managers the contacts and actions, saying when a contact was not given', async () => {
    renderPage(true);

    expect(await screen.findByText('Sam Patel 07700 900123')).toBeInTheDocument();
    expect(screen.getByText('Not given')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Message the other team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel fixture' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report or block' })).toBeInTheDocument();
  });

  it('shows a member the fixture read-only, without the contact details the API leaves out', async () => {
    const withoutContact = ({ id, name, clubName, venueId }: FixtureTeamView): FixtureTeamView => ({ id, name, clubName, venueId });
    renderPage(false, { ...fixture, homeTeam: withoutContact(fixture.homeTeam), awayTeam: withoutContact(fixture.awayTeam) });

    expect(await screen.findByText(/only shown to team managers/)).toBeInTheDocument();
    expect(screen.getByText('Cost share')).toBeInTheDocument();
    expect(screen.queryByText('Not given')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel fixture' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Message the other team' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report or block' })).not.toBeInTheDocument();
  });
});

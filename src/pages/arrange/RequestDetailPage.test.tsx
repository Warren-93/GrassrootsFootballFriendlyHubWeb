import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestDetailPage } from './RequestDetailPage';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { friendlyRequestRepository } from '../../api/friendlyRequestRepository';
import type { FriendlyRequestView } from '../../api/types';

vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/friendlyRequestRepository', () => ({ friendlyRequestRepository: { get: vi.fn() } }));
vi.mock('../../api/conversationRepository', () => ({ conversationRepository: { start: vi.fn() } }));

const request: FriendlyRequestView = {
  id: 'r1',
  senderTeamId: 'team-1',
  recipientTeamId: 'team-2',
  status: 'CHANGES_REQUESTED',
  date: '2026-11-07',
  startTime: '10:00:00',
  endTime: '11:30:00',
  venueId: 'v2',
  homeTeamId: 'team-1',
  awayTeamId: 'team-2',
  costShare: 'SPLIT',
  refereeArrangement: 'NONE',
  message: null,
  actionReason: null,
  availableActions: [],
  senderContact: { teamId: 'team-1', teamName: 'Riverside U12 Girls', managerName: 'Jamie Muir', contactPhone: '07700 900123', venueId: 'v2' },
  recipientContact: { teamId: 'team-2', teamName: 'Harriers U12 Girls', managerName: 'Alex Smith', contactPhone: '07700 900456', venueId: null },
  proposedStartTime: null,
  proposedEndTime: null,
  proposedVenueId: 'v1',
  venue: {
    id: 'v2',
    name: 'Riverside 3G Centre',
    address: '22 Mill Lane',
    postcode: 'RH16 3XY',
    pitchSurface: 'THREE_G',
    accessNotes: null,
    parkingNotes: null,
    latitude: null,
    longitude: null,
  },
  proposedVenue: {
    id: 'v1',
    name: 'Victoria Park',
    address: '1 Park Road',
    postcode: 'RH16 1AA',
    pitchSurface: 'GRASS',
    accessNotes: null,
    parkingNotes: null,
    latitude: null,
    longitude: null,
  },
  senderTeam: { id: 'team-1', name: 'Riverside U12 Girls', clubName: 'Riverside FC', badgeUrl: null },
  recipientTeam: { id: 'team-2', name: 'Harriers U12 Girls', clubName: 'Harriers FC', badgeUrl: null },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/request/r1']}>
      <Routes>
        <Route path="/request/:requestId" element={<RequestDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequestDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('names the other team and labels contacts with team names', async () => {
    vi.mocked(friendlyRequestRepository.get).mockResolvedValue({ ok: true, value: request });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Harriers U12 Girls' })).toBeInTheDocument();
    expect(screen.getByText('Friendly request to')).toBeInTheDocument();
    expect(screen.getByText('Jamie Muir 07700 900123').previousSibling).toHaveTextContent('Riverside U12 Girls');
    expect(screen.getByText('Alex Smith 07700 900456').previousSibling).toHaveTextContent('Harriers U12 Girls');
    expect(screen.queryByText('Sender')).not.toBeInTheDocument();
  });

  it('shows the venue with directions and the proposed venue by name', async () => {
    vi.mocked(friendlyRequestRepository.get).mockResolvedValue({ ok: true, value: request });

    renderPage();

    expect(await screen.findByText('Riverside 3G Centre')).toBeInTheDocument();
    const directions = screen.getAllByRole('link', { name: /Directions/ });
    expect(directions[0]).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=RH16%203XY');
    expect(screen.getByText('Victoria Park')).toBeInTheDocument();
    expect(screen.queryByText('A different venue has been proposed')).not.toBeInTheDocument();
  });
});

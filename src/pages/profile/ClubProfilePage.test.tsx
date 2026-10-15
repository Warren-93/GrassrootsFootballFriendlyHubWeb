import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClubProfilePage } from './ClubProfilePage';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentTeam } from '../../session/CurrentTeamContext';
import { clubRepository } from '../../api/clubRepository';
import { teamRepository } from '../../api/teamRepository';
import { memberRepository } from '../../api/memberRepository';
import type { ClubView, InviteView, MemberView } from '../../api/types';

vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../../api/clubRepository', () => ({ clubRepository: { get: vi.fn() } }));
vi.mock('../../api/teamRepository', () => ({ teamRepository: { listByClub: vi.fn() } }));
vi.mock('../../api/memberRepository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/memberRepository')>()),
  memberRepository: {
    list: vi.fn(),
    listInvites: vi.fn(),
    add: vi.fn(),
    cancelInvite: vi.fn(),
    joinCode: vi.fn(),
  },
}));

const club: ClubView = {
  id: 'club-1',
  name: 'Riverside FC',
  badgeUrl: null,
  postcode: 'RH16 1AA',
  longitude: -0.1,
  latitude: 51,
  website: null,
  contactEmail: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const member: MemberView = {
  membershipId: 'm1',
  userId: 'u1',
  email: 'jamie@riversidefc.co.uk',
  displayName: 'Jamie Muir',
  role: 'CLUB_ADMIN',
  scope: 'CLUB',
  joinedAt: '2026-01-01T00:00:00Z',
};

function invite(id: string, email: string): InviteView {
  return {
    id,
    email,
    role: 'TEAM_MANAGER',
    teamId: 'team-1',
    teamName: 'Riverside U12 Girls',
    createdAt: '2026-10-15T00:00:00Z',
    expiresAt: '2026-11-14T00:00:00Z',
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/club']}>
      <ClubProfilePage />
    </MemoryRouter>,
  );
}

describe('ClubProfilePage members', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ session: { id: 'u1' } } as ReturnType<typeof useAuth>);
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(clubRepository.get).mockResolvedValue({ ok: true, value: club });
    vi.mocked(teamRepository.listByClub).mockResolvedValue({ ok: true, value: [] });
    vi.mocked(memberRepository.list).mockResolvedValue({ ok: true, value: [member] });
    vi.mocked(memberRepository.joinCode).mockResolvedValue({ ok: true, value: { code: 'K7Q2ZP' } });
    vi.mocked(memberRepository.listInvites).mockReset();
    vi.mocked(memberRepository.add).mockReset();
  });

  it('says an invitation was sent when the email has no account yet, and lists it as pending', async () => {
    const sent = invite('i1', 'new.coach@example.com');
    vi.mocked(memberRepository.listInvites)
      .mockResolvedValueOnce({ ok: true, value: [] })
      .mockResolvedValueOnce({ ok: true, value: [sent] });
    vi.mocked(memberRepository.add).mockResolvedValue({ ok: true, value: { status: 'INVITED', invite: sent } });
    renderPage();

    await userEvent.type(await screen.findByLabelText('Email address'), 'new.coach@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add member' }));

    expect(memberRepository.add).toHaveBeenCalledWith('team-1', { email: 'new.coach@example.com', role: 'TEAM_MANAGER' });
    expect(await screen.findByText('Invitation sent to new.coach@example.com')).toBeInTheDocument();
    expect(await screen.findByText('Pending invitations')).toBeInTheDocument();
    expect(screen.queryByText(/no invitation email/)).not.toBeInTheDocument();
  });

  it('cancels a pending invitation', async () => {
    vi.mocked(memberRepository.listInvites).mockResolvedValue({
      ok: true,
      value: [invite('i1', 'first@example.com'), invite('i2', 'second@example.com')],
    });
    vi.mocked(memberRepository.cancelInvite).mockResolvedValue({ ok: true, value: undefined });
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel invitation to first@example.com' }));

    expect(memberRepository.cancelInvite).toHaveBeenCalledWith('team-1', 'i1');
    expect(screen.queryByText('first@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('second@example.com')).toBeInTheDocument();
  });

  it('confirms when an existing account was added straight away', async () => {
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [] });
    vi.mocked(memberRepository.add).mockResolvedValue({
      ok: true,
      value: { ...member, membershipId: 'm2', userId: 'u2', email: 'sam@example.com', displayName: 'Sam Lee', role: 'TEAM_MANAGER', scope: 'TEAM' },
    });
    renderPage();

    await userEvent.type(await screen.findByLabelText('Email address'), 'sam@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add member' }));

    expect(await screen.findByText('Sam Lee has been added to the team')).toBeInTheDocument();
    expect(screen.queryByText('Pending invitations')).not.toBeInTheDocument();
  });
});

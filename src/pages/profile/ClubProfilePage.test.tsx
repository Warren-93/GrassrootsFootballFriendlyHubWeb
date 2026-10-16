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
import type { ClubView, InviteView, MemberView, TeamView } from '../../api/types';

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
    updateRole: vi.fn(),
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

const manager: MemberView = {
  ...member,
  membershipId: 'm2',
  userId: 'u2',
  email: 'sam@example.com',
  displayName: 'Sam Lee',
  role: 'TEAM_MANAGER',
  scope: 'TEAM',
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
    vi.mocked(memberRepository.updateRole).mockReset();
  });

  async function roleOptions(combobox: string) {
    await userEvent.click(screen.getByRole('combobox', { name: combobox }));
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    await userEvent.keyboard('{Escape}');
    return options;
  }

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

  it("shows a team manager the members, though only club admins can read the club", async () => {
    vi.mocked(clubRepository.get).mockResolvedValue({ ok: false, message: 'That club could not be found.', status: 404 });
    vi.mocked(teamRepository.listByClub).mockResolvedValue({ ok: false, message: 'That club could not be found.', status: 404 });
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [invite('i1', 'new.coach@example.com')] });
    renderPage();

    expect(await screen.findByText(/Jamie Muir/)).toBeInTheDocument();
    expect(screen.getByText('new.coach@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.queryByText('That club could not be found.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit club' })).not.toBeInTheDocument();
  });

  it('keeps whether the user runs the club when they switch to another of its squads', async () => {
    const setActive = vi.fn();
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage: true, canManageClub: true },
      setActive,
      clear: vi.fn(),
    });
    const squad = (id: string, name: string) => ({ id, name, clubId: 'club-1', ageGroup: 'U14', format: 'NINE_A_SIDE' }) as TeamView;
    vi.mocked(teamRepository.listByClub).mockResolvedValue({
      ok: true,
      value: [squad('team-1', 'Riverside U12 Girls'), squad('team-2', 'Riverside U14 Boys')],
    });
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [] });
    renderPage();

    await userEvent.click(await screen.findByText('Riverside U14 Boys'));

    expect(setActive).toHaveBeenCalledWith({ teamId: 'team-2', teamName: 'Riverside U14 Boys', clubId: 'club-1', canManageClub: true });
  });

  it("drops the last club's details on switching to a team in a club they don't run", async () => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage: true, canManageClub: true },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(teamRepository.listByClub).mockResolvedValue({
      ok: true,
      value: [{ id: 'team-1', name: 'Riverside U12 Girls', clubId: 'club-1', ageGroup: 'U12', format: 'NINE_A_SIDE' } as TeamView],
    });
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [] });
    const { rerender } = renderPage();
    expect(await screen.findByRole('button', { name: 'Edit club' })).toBeInTheDocument();

    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-9', teamName: 'Hillside U10 Girls', clubId: 'club-2', canManage: true, canManageClub: false },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(clubRepository.get).mockResolvedValue({ ok: false, message: 'That club could not be found.', status: 404 });
    vi.mocked(teamRepository.listByClub).mockResolvedValue({ ok: false, message: 'That club could not be found.', status: 404 });
    vi.mocked(memberRepository.list).mockResolvedValue({ ok: true, value: [manager] });
    rerender(
      <MemoryRouter initialEntries={['/club']}>
        <ClubProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Sam Lee')).toBeInTheDocument();
    expect(screen.queryByText('Riverside FC')).not.toBeInTheDocument();
    expect(screen.queryByText('Riverside U12 Girls')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit club' })).not.toBeInTheDocument();
  });

  it("doesn't let a team manager add, change or remove a club admin", async () => {
    vi.mocked(useAuth).mockReturnValue({ session: { id: 'u2' } } as ReturnType<typeof useAuth>);
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage: true, canManageClub: false },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(clubRepository.get).mockResolvedValue({ ok: false, message: 'That club could not be found.', status: 404 });
    vi.mocked(memberRepository.list).mockResolvedValue({ ok: true, value: [member, manager] });
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [] });
    renderPage();

    expect(await screen.findByText('Jamie Muir')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Role for Jamie Muir' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Jamie Muir' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Sam Lee' })).toBeInTheDocument();
    expect(await roleOptions('Role for Sam Lee')).toEqual(['No management role', 'Team manager']);
    expect(await roleOptions('Role')).toEqual(['No management role', 'Team manager']);
    expect(screen.getByText(/Only a club admin can add club admins\./)).toBeInTheDocument();
  });

  it.each([
    ['a club admin', true],
    ['an older API', undefined],
  ])('lets %s add, change and remove club admins as before', async (_, canManageClub) => {
    vi.mocked(useCurrentTeam).mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside U12 Girls', clubId: 'club-1', canManage: true, canManageClub },
      setActive: vi.fn(),
      clear: vi.fn(),
    });
    vi.mocked(memberRepository.list).mockResolvedValue({ ok: true, value: [member, manager] });
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [] });
    renderPage();

    expect(await screen.findByRole('combobox', { name: 'Role for Jamie Muir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Jamie Muir' })).toBeInTheDocument();
    expect(await roleOptions('Role for Sam Lee')).toEqual(['No management role', 'Team manager', 'Club admin']);
    expect(await roleOptions('Role')).toEqual(['No management role', 'Team manager', 'Club admin']);
    expect(screen.queryByText(/Only a club admin can add club admins/)).not.toBeInTheDocument();
  });

  it("shows the API's message when it refuses a role change", async () => {
    vi.mocked(memberRepository.listInvites).mockResolvedValue({ ok: true, value: [] });
    vi.mocked(memberRepository.updateRole).mockResolvedValue({
      ok: false,
      message: 'Only a club admin can add, change or remove club admins.',
      status: 403,
    });
    renderPage();

    await userEvent.click(await screen.findByRole('combobox', { name: 'Role for Jamie Muir' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Team manager' }));

    expect(memberRepository.updateRole).toHaveBeenCalledWith('team-1', 'm1', { role: 'TEAM_MANAGER' });
    expect(await screen.findByText('Only a club admin can add, change or remove club admins.')).toBeInTheDocument();
  });
});

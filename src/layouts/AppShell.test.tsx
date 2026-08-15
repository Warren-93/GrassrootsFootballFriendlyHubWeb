import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { useAuth } from '../auth/AuthContext';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { notificationRepository } from '../api/notificationRepository';
import { teamRepository } from '../api/teamRepository';

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../session/CurrentTeamContext', () => ({ useCurrentTeam: vi.fn() }));
vi.mock('../api/notificationRepository', () => ({
  notificationRepository: { unreadCount: vi.fn() },
}));
vi.mock('../api/teamRepository', () => ({
  teamRepository: { listMine: vi.fn() },
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseCurrentTeam = vi.mocked(useCurrentTeam);
const mockedUnreadCount = vi.mocked(notificationRepository.unreadCount);
const mockedListMine = vi.mocked(teamRepository.listMine);

const session = { id: '1', email: 'jamie@riversidefc.co.uk', displayName: 'Jamie Muir', emailVerified: true };

function setDesktop(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderShell(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>Dashboard content</div>} />
          <Route path="/calendar" element={<div>Calendar content</div>} />
          <Route path="/settings" element={<div>Settings content</div>} />
          <Route path="/team/team-1" element={<div>Team profile content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    setDesktop(true);
    mockedUseAuth.mockReturnValue({ session, signOut: vi.fn() } as unknown as ReturnType<typeof useAuth>);
    mockedUnreadCount.mockResolvedValue({ ok: true, value: { count: 0 } });
    mockedListMine.mockResolvedValue({ ok: true, value: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the top nav with all primary destinations on desktop, no sidebar', async () => {
    mockedUseCurrentTeam.mockReturnValue({ active: null, setActive: vi.fn(), clear: vi.fn() });

    renderShell();

    for (const label of ['Home', 'Publish availability', 'Discover', 'Arrange & fixtures', 'Messages', 'Team & club', 'Account']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    // The old permanent sidebar is gone - there's no navigation landmark other than the top bar.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('collapses to a menu button on narrow viewports instead of showing flat links', () => {
    setDesktop(false);
    mockedUseCurrentTeam.mockReturnValue({ active: null, setActive: vi.fn(), clear: vi.fn() });

    renderShell();

    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discover' })).not.toBeInTheDocument();
  });

  it('disables team-scoped links until a team is active', async () => {
    mockedUseCurrentTeam.mockReturnValue({ active: null, setActive: vi.fn(), clear: vi.fn() });

    renderShell();

    await waitFor(() => expect(mockedListMine).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: 'Discover' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Arrange & fixtures' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Team & club' })).toBeDisabled();
    // Home and Account never depend on having a team.
    expect(screen.getByRole('button', { name: 'Home' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Account' })).toBeEnabled();
  });

  it('enables team-scoped links and exposes Team profile / Members / Club / Venues via the Team & club menu once a team is active', async () => {
    mockedUseCurrentTeam.mockReturnValue({
      active: { teamId: 'team-1', teamName: 'Riverside FC', clubId: 'club-1' },
      setActive: vi.fn(),
      clear: vi.fn(),
    });

    renderShell();

    const teamClubButton = screen.getByRole('button', { name: 'Team & club' });
    expect(teamClubButton).toBeEnabled();

    await userEvent.click(teamClubButton);

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Team profile')).toBeInTheDocument();
    expect(within(menu).getByText('Members')).toBeInTheDocument();
    expect(within(menu).getByText('Club')).toBeInTheDocument();
    expect(within(menu).getByText('Venues')).toBeInTheDocument();
  });

  it('navigates to the settings route when Account is clicked', async () => {
    mockedUseCurrentTeam.mockReturnValue({ active: null, setActive: vi.fn(), clear: vi.fn() });

    renderShell();

    await userEvent.click(screen.getByRole('button', { name: 'Account' }));

    expect(await screen.findByText('Settings content')).toBeInTheDocument();
  });
});

import type { ReactNode } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/** The navigation menu's destinations, shared by both shells (see NavDrawerContent). */
export const NAV_DRAWER_WIDTH = 232;

export interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  requiresTeam?: boolean;
}

function mainItems(): NavItem[] {
  return [
    { label: 'Home', icon: <HomeIcon />, path: '/' },
    { label: 'Publish availability', icon: <CalendarMonthIcon />, path: '/calendar', requiresTeam: true },
    { label: 'Discover', icon: <SearchIcon />, path: '/search', requiresTeam: true },
    { label: 'Arrange & fixtures', icon: <SportsSoccerIcon />, path: '/fixtures', requiresTeam: true },
    { label: 'Messages', icon: <ChatBubbleOutlineIcon />, path: '/messages', requiresTeam: true },
  ];
}

function manageItems(teamId: string | undefined): NavItem[] {
  return [
    { label: 'Team profile', icon: <GroupsIcon />, path: teamId ? `/team/${teamId}` : '/role-selection', requiresTeam: true },
    { label: 'Club & members', icon: <ApartmentIcon />, path: '/club', requiresTeam: true },
    { label: 'Venues', icon: <PlaceIcon />, path: '/venues', requiresTeam: true },
    { label: 'Verification', icon: <VerifiedUserIcon />, path: teamId ? `/team/${teamId}/verification` : '/role-selection', requiresTeam: true },
  ];
}

function accountItems(): NavItem[] {
  return [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { label: 'Notifications', icon: <NotificationsNoneIcon />, path: '/settings/notifications' },
    { label: 'Privacy & data', icon: <PrivacyTipIcon />, path: '/settings/privacy' },
    { label: 'Report & block', icon: <ReportOutlinedIcon />, path: '/settings/report' },
    { label: 'Help', icon: <HelpOutlineIcon />, path: '/settings/help' },
  ];
}

/** League > My leagues, then each of the team's leagues by name, each opening its fixtures. */
export function leagueItems(leagues: { id: string; name: string }[] = []): NavItem[] {
  return [
    { label: 'My leagues', icon: <EmojiEventsOutlinedIcon />, path: '/leagues', requiresTeam: true },
    ...leagues.map((l) => ({ label: l.name, icon: <ChevronRightIcon />, path: `/leagues/${l.id}`, requiresTeam: true })),
  ];
}

export function navSections(teamId: string | undefined, leagues: { id: string; name: string }[] = []): [string, NavItem[]][] {
  return [
    ['MAIN', mainItems()],
    ['LEAGUE', leagueItems(leagues)],
    ['MANAGE', manageItems(teamId)],
    ['ACCOUNT', accountItems()],
  ];
}

function isActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * The menu item for the current page. Nested routes like /team/:id and
 * /team/:id/verification both match the prefix test, which would highlight
 * both items at once - only the most specific (longest) path wins.
 */
export function currentNavItem(
  pathname: string,
  teamId: string | undefined,
  leagues: { id: string; name: string }[] = [],
): NavItem | null {
  return navSections(teamId, leagues)
    .flatMap(([, items]) => items)
    .reduce<NavItem | null>(
      (best, item) => (isActive(pathname, item.path) && (!best || item.path.length > best.path.length) ? item : best),
      null,
    );
}

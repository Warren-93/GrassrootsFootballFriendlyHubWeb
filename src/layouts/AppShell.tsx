import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { TeamView } from '../api/types';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotificationsIcon from '@mui/icons-material/Notifications';
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
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { useNavPreference } from '../session/NavPreferenceContext';
import { notificationRepository } from '../api/notificationRepository';
import { teamRepository } from '../api/teamRepository';
import { NotificationsModal } from '../components/NotificationsModal';

interface NavLink {
  label: string;
  path: string;
  /** Only enabled once a team is active - these pages don't make sense without one. */
  requiresTeam?: boolean;
}

/** The five always-visible top-nav destinations - Team & club and Account live one level deeper (dropdown / avatar menu) so the bar stays flat rather than trying to fit nine items across. */
function usePrimaryLinks(): NavLink[] {
  return [
    { label: 'Home', path: '/' },
    { label: 'Publish availability', path: '/calendar', requiresTeam: true },
    { label: 'Discover', path: '/search', requiresTeam: true },
    { label: 'Arrange & fixtures', path: '/fixtures', requiresTeam: true },
    { label: 'Messages', path: '/messages', requiresTeam: true },
  ];
}

function useTeamClubLinks(teamId: string | undefined): NavLink[] {
  return [
    { label: 'Team profile', path: teamId ? `/team/${teamId}` : '/role-selection', requiresTeam: true },
    { label: 'Club & members', path: '/club', requiresTeam: true },
    { label: 'Venues', path: '/venues', requiresTeam: true },
    { label: 'Verification', path: teamId ? `/team/${teamId}/verification` : '/role-selection', requiresTeam: true },
  ];
}

function useAccountLinks(): NavLink[] {
  return [
    { label: 'Settings', path: '/settings' },
    { label: 'Notifications', path: '/settings/notifications' },
    { label: 'Privacy & data', path: '/settings/privacy' },
    { label: 'Report & block', path: '/settings/report' },
    { label: 'Help', path: '/settings/help' },
  ];
}

/**
 * The persistent shell for every "dashboard" screen - a top nav bar (logo,
 * flat section links, notification bell, account menu) rather than a
 * permanent sidebar, so the frame stays out of the way of the content below
 * it. "Team & club" is a dropdown of its four sub-pages rather than its own
 * top-level link, since flattening all nine destinations into one bar
 * doesn't fit; on narrow viewports the whole nav collapses into a drawer
 * behind a menu button instead of trying to wrap. Onboarding routes
 * (create-club, create-team, etc.) deliberately render outside this shell:
 * there's no team yet for the nav to be about.
 */
export function AppShell() {
  const theme = useTheme();
  // noSsr: this is a client-only SPA, so there's no hydration mismatch to
  // guard against - without it, useMediaQuery defaults to false on first
  // render and only corrects itself once its effect settles, which can leave
  // the mobile nav showing on a desktop-width first paint.
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [teamMenuAnchor, setTeamMenuAnchor] = useState<null | HTMLElement>(null);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [myTeams, setMyTeams] = useState<TeamView[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { active, setActive, clear } = useCurrentTeam();
  const { setNavStyle } = useNavPreference();
  const primaryLinks = usePrimaryLinks();
  const teamClubLinks = useTeamClubLinks(active?.teamId);
  const accountLinks = useAccountLinks();

  function refreshUnreadCount() {
    notificationRepository.unreadCount().then((result) => {
      if (result.ok) setUnreadCount(result.value.count);
    });
  }

  useEffect(refreshUnreadCount, [location.pathname]);

  // Dashboard already shows notifications inline (see DashboardPage), so its
  // bell keeps the old full-page navigation rather than opening a modal on
  // top of content that's already there; every other page opens the modal.
  function handleBellClick() {
    if (location.pathname === '/dashboard') navigate('/notifications');
    else setNotificationsOpen(true);
  }

  // The active team is a local cache (see CurrentTeamContext) that sign-out
  // clears, so a fresh session has no way to know which team it's acting as
  // until this runs - without it, every page here would keep treating a real
  // member as if they'd never created or joined a team. Reconciling against
  // the server on every signed-in session (not just when the cache is empty)
  // also self-heals a stale cached team left over from a different account on
  // a shared browser, rather than blindly trusting whatever's in storage.
  useEffect(() => {
    if (!session) return;
    teamRepository.listMine().then((result) => {
      if (!result.ok) return;
      const mine = result.value;
      setMyTeams(mine);
      if (mine.length === 0) {
        if (active) clear();
        return;
      }
      if (!active || !mine.some((t) => t.id === active.teamId)) {
        const t = mine[0];
        setActive({ teamId: t.id, teamName: t.name, clubId: t.clubId });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  function handleSignOut() {
    signOut();
    clear();
    navigate('/welcome');
  }

  function goToDashboard() {
    setNavStyle('sidebar');
    navigate('/dashboard');
  }

  function handleTeamSwitch(event: SelectChangeEvent) {
    const t = myTeams.find((team) => team.id === event.target.value);
    if (t) setActive({ teamId: t.id, teamName: t.name, clubId: t.clubId });
  }

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  const teamClubActive = teamClubLinks.some((item) => isActive(item.path));
  const accountActive = accountLinks.some((item) => isActive(item.path));
  // Nested routes like /team/:id and /team/:id/verification (or /settings
  // and /settings/notifications) both match the prefix test above, which
  // would highlight two menu items at once - only the most specific
  // (longest) matching path should win.
  const currentTeamClubItem = teamClubLinks.reduce<NavLink | null>(
    (best, item) => (isActive(item.path) && (!best || item.path.length > best.path.length) ? item : best),
    null,
  );
  const currentAccountItem = accountLinks.reduce<NavLink | null>(
    (best, item) => (isActive(item.path) && (!best || item.path.length > best.path.length) ? item : best),
    null,
  );

  const iconFor: Record<string, ReactNode> = {
    Home: <HomeIcon />,
    'Publish availability': <CalendarMonthIcon />,
    Discover: <SearchIcon />,
    'Arrange & fixtures': <SportsSoccerIcon />,
    Messages: <ChatBubbleOutlineIcon />,
    'Team profile': <GroupsIcon />,
    'Club & members': <ApartmentIcon />,
    Venues: <PlaceIcon />,
    Verification: <VerifiedUserIcon />,
    Settings: <SettingsIcon />,
    Notifications: <NotificationsNoneIcon />,
    'Privacy & data': <PrivacyTipIcon />,
    'Report & block': <ReportOutlinedIcon />,
    Help: <HelpOutlineIcon />,
  };

  const mobileDrawer = (
    <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 28, height: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          PitchMate
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, py: 1, overflowY: 'auto' }}>
        {primaryLinks.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActive(item.path)}
            disabled={item.requiresTeam && !active}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ mx: 1, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{iconFor[item.label]}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListSubheader sx={{ mt: 1 }}>Team &amp; club</ListSubheader>
        {teamClubLinks.map((item) => (
          <ListItemButton
            key={item.path}
            selected={item === currentTeamClubItem}
            disabled={item.requiresTeam && !active}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ mx: 1, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{iconFor[item.label]}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListSubheader sx={{ mt: 1 }}>Account</ListSubheader>
        <ListItemButton
          onClick={() => {
            goToDashboard();
            setMobileOpen(false);
          }}
          sx={{ mx: 1, borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        {accountLinks.map((item) => (
          <ListItemButton
            key={item.path}
            selected={item === currentAccountItem}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ mx: 1, borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{iconFor[item.label]}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 3 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}

          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box component="img" src="/favicon.svg" alt="" sx={{ width: 26, height: 26 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Pitch<Box component="span" sx={{ color: 'primary.main' }}>Mate</Box>
            </Typography>
          </Stack>

          {isDesktop && (
            <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1, alignItems: 'center' }}>
              {primaryLinks.map((item) => {
                const disabled = item.requiresTeam && !active;
                return (
                  <Box
                    key={item.path}
                    component="button"
                    disabled={disabled}
                    onClick={() => navigate(item.path)}
                    sx={{
                      font: 'inherit',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: disabled ? 'default' : 'pointer',
                      color: disabled ? 'text.disabled' : isActive(item.path) ? 'primary.main' : 'text.primary',
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 1,
                      '&:hover': disabled ? undefined : { bgcolor: 'action.hover' },
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}

              <Box
                component="button"
                disabled={!active}
                onClick={(e) => setTeamMenuAnchor(e.currentTarget)}
                sx={{
                  font: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: active ? 'pointer' : 'default',
                  color: !active ? 'text.disabled' : teamClubActive ? 'primary.main' : 'text.primary',
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  '&:hover': !active ? undefined : { bgcolor: 'action.hover' },
                }}
              >
                Team &amp; club
                <ExpandMoreIcon sx={{ fontSize: 18, ml: 0.25 }} />
              </Box>
              <Menu anchorEl={teamMenuAnchor} open={!!teamMenuAnchor} onClose={() => setTeamMenuAnchor(null)}>
                {teamClubLinks.map((item) => (
                  <MenuItem
                    key={item.path}
                    selected={item === currentTeamClubItem}
                    onClick={() => {
                      setTeamMenuAnchor(null);
                      navigate(item.path);
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>{iconFor[item.label]}</ListItemIcon>
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>

              <Box
                component="button"
                onClick={(e) => setAccountMenuAnchor(e.currentTarget)}
                sx={{
                  font: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: accountActive ? 'primary.main' : 'text.primary',
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                Account
                <ExpandMoreIcon sx={{ fontSize: 18, ml: 0.25 }} />
              </Box>
              <Menu anchorEl={accountMenuAnchor} open={!!accountMenuAnchor} onClose={() => setAccountMenuAnchor(null)}>
                {accountLinks.map((item) => (
                  <MenuItem
                    key={item.path}
                    selected={item === currentAccountItem}
                    onClick={() => {
                      setAccountMenuAnchor(null);
                      navigate(item.path);
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>{iconFor[item.label]}</ListItemIcon>
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Stack>
          )}

          {!isDesktop && <Box sx={{ flexGrow: 1 }} />}

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton onClick={handleBellClick} aria-label="Notifications">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} aria-label="Account menu">
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{session?.displayName?.[0] ?? '?'}</Avatar>
            </IconButton>
            <Menu anchorEl={userMenuAnchor} open={!!userMenuAnchor} onClose={() => setUserMenuAnchor(null)}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {session?.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {session?.email}
                  </Typography>
                </Stack>
              </MenuItem>
              {active && myTeams.length > 1 && (
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current team
                  </Typography>
                  <Select value={active.teamId} onChange={handleTeamSwitch} size="small" fullWidth sx={{ mt: 0.5 }}>
                    {myTeams.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
              <Divider />
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  goToDashboard();
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  navigate('/settings');
                }}
              >
                Settings
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  handleSignOut();
                }}
              >
                Sign out
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={!isDesktop && mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box' } }}
      >
        {mobileDrawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>

      <NotificationsModal
        open={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          refreshUnreadCount();
        }}
      />
    </Box>
  );
}

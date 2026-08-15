import { useEffect, useState } from 'react';
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
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { useNavPreference } from '../session/NavPreferenceContext';
import { notificationRepository } from '../api/notificationRepository';
import { teamRepository } from '../api/teamRepository';
import { brand } from '../theme/theme';

const DRAWER_WIDTH = 232;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresTeam?: boolean;
}

function useNavItems(): NavItem[] {
  return [
    { label: 'Home', icon: <HomeIcon />, path: '/' },
    { label: 'Publish availability', icon: <CalendarMonthIcon />, path: '/calendar', requiresTeam: true },
    { label: 'Discover', icon: <SearchIcon />, path: '/search', requiresTeam: true },
    { label: 'Arrange & fixtures', icon: <SportsSoccerIcon />, path: '/fixtures', requiresTeam: true },
    { label: 'Messages', icon: <ChatBubbleOutlineIcon />, path: '/messages', requiresTeam: true },
  ];
}

function useManageItems(teamId: string | undefined): NavItem[] {
  return [
    { label: 'Team profile', icon: <GroupsIcon />, path: teamId ? `/team/${teamId}` : '/role-selection', requiresTeam: true },
    { label: 'Club & members', icon: <ApartmentIcon />, path: '/club', requiresTeam: true },
    { label: 'Venues', icon: <PlaceIcon />, path: '/venues', requiresTeam: true },
    { label: 'Verification', icon: <VerifiedUserIcon />, path: teamId ? `/team/${teamId}/verification` : '/role-selection', requiresTeam: true },
    { label: 'Account', icon: <SettingsIcon />, path: '/settings' },
  ];
}

/**
 * The alternate "Sidebar view" shell from the concept - a persistent dark
 * navy rail instead of the default top nav (AppShell.tsx). Offered as a real
 * user preference (see NavPreferenceContext) rather than a page-scoped
 * illusion: toggling it here changes the chrome for every signed-in page,
 * not just Home, which is the only sound way to offer two navigation
 * paradigms in a router-driven app. Data logic (team reconciliation, unread
 * count, sign out) is identical to AppShell.tsx - only the chrome differs.
 *
 * There's no standalone "switch to top nav" control: clicking Home is how
 * you get back to the top-nav experience, since Home always means top nav
 * the same way Dashboard (account menu) always means this sidebar.
 */
export function AppShellSidebar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myTeams, setMyTeams] = useState<TeamView[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { active, setActive, clear } = useCurrentTeam();
  const { setNavStyle } = useNavPreference();
  const navItems = useNavItems();
  const manageItems = useManageItems(active?.teamId);

  useEffect(() => {
    notificationRepository.unreadCount().then((result) => {
      if (result.ok) setUnreadCount(result.value.count);
    });
  }, [location.pathname]);

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

  function handleTeamSwitch(event: SelectChangeEvent) {
    const t = myTeams.find((team) => team.id === event.target.value);
    if (t) setActive({ teamId: t.id, teamName: t.name, clubId: t.clubId });
  }

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  // Nested routes like /team/:id and /team/:id/verification both match the
  // prefix test above, which would highlight both nav items at once - only
  // the most specific (longest) matching path should win.
  const currentNavItem = [...navItems, ...manageItems].reduce<NavItem | null>(
    (best, item) => (isActive(item.path) && (!best || item.path.length > best.path.length) ? item : best),
    null,
  );

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: brand.void, color: '#AEC2B5' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 26, height: 26 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff' }}>
          Pitch<Box component="span" sx={{ color: brand.lime }}>Mate</Box>
        </Typography>
      </Toolbar>
      <List sx={{ flexGrow: 1, py: 1, overflowY: 'auto' }}>
        <ListSubheader sx={{ bgcolor: 'transparent', color: '#5E7466', fontSize: 10, letterSpacing: '.1em', lineHeight: 3 }}>
          MAIN
        </ListSubheader>
        {navItems.map((item) => {
          const disabled = item.requiresTeam && !active;
          const active_ = item === currentNavItem;
          return (
            <ListItemButton
              key={item.path}
              selected={active_}
              disabled={disabled}
              onClick={() => {
                // Home is the top-nav experience - clicking it from the sidebar
                // shell is how you get back to top nav, rather than a separate
                // "switch to top nav" control.
                if (item.path === '/') setNavStyle('top');
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                my: 0.25,
                borderRadius: 1.5,
                color: '#B8C8BE',
                '&.Mui-selected': { bgcolor: brand.pitch, color: '#fff' },
                '&.Mui-selected:hover': { bgcolor: brand.pitch },
                '&.Mui-disabled': { color: '#4A5A50', opacity: 1 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 600 } } }} />
            </ListItemButton>
          );
        })}
        <ListSubheader sx={{ bgcolor: 'transparent', color: '#5E7466', fontSize: 10, letterSpacing: '.1em', lineHeight: 3, mt: 1 }}>
          MANAGE
        </ListSubheader>
        {manageItems.map((item) => {
          const disabled = item.requiresTeam && !active;
          const active_ = item === currentNavItem;
          return (
            <ListItemButton
              key={item.path}
              selected={active_}
              disabled={disabled}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                my: 0.25,
                borderRadius: 1.5,
                color: '#B8C8BE',
                '&.Mui-selected': { bgcolor: brand.pitch, color: '#fff' },
                '&.Mui-selected:hover': { bgcolor: brand.pitch },
                '&.Mui-disabled': { color: '#4A5A50', opacity: 1 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 600 } } }} />
            </ListItemButton>
          );
        })}
      </List>
      {active && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Typography variant="caption" sx={{ color: '#8AA091' }}>
            Signed in as
          </Typography>
          {myTeams.length > 1 ? (
            <Select
              value={active.teamId}
              onChange={handleTeamSwitch}
              size="small"
              fullWidth
              sx={{
                mt: 0.5,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,.06)',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,.15)' },
              }}
            >
              {myTeams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }} noWrap>
              {active.teamName}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {isActive('/dashboard') ? 'Dashboard' : currentNavItem?.label ?? ''}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/notifications')} aria-label="Notifications">
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
              <Divider />
              <MenuItem
                selected={isActive('/dashboard')}
                onClick={() => {
                  setUserMenuAnchor(null);
                  navigate('/dashboard');
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

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' } }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

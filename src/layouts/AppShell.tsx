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
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PlaceIcon from '@mui/icons-material/Place';
import SettingsIcon from '@mui/icons-material/Settings';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { notificationRepository } from '../api/notificationRepository';
import { teamRepository } from '../api/teamRepository';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  /** Only shown once a team is active - these pages don't make sense without one. */
  requiresTeam?: boolean;
}

function useNavItems(teamId: string | undefined): NavItem[] {
  return [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Find a friendly', icon: <SearchIcon />, path: '/search', requiresTeam: true },
    { label: 'Requests & fixtures', icon: <SportsSoccerIcon />, path: '/fixtures', requiresTeam: true },
    { label: 'Calendar', icon: <CalendarMonthIcon />, path: '/calendar', requiresTeam: true },
    { label: 'Team profile', icon: <GroupsIcon />, path: teamId ? `/team/${teamId}` : '/role-selection', requiresTeam: true },
    { label: 'Club', icon: <ApartmentIcon />, path: '/club', requiresTeam: true },
    { label: 'Venues', icon: <PlaceIcon />, path: '/venues', requiresTeam: true },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];
}

/**
 * The persistent shell for every "dashboard" screen - sidebar + top bar,
 * so switching between sections never depends on the browser's back button
 * the way a screen-stack mobile app does. Onboarding routes (create-club,
 * create-team, etc.) deliberately render outside this shell: there's no
 * team yet for the sidebar to be about.
 */
export function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { active, setActive, clear } = useCurrentTeam();
  const navItems = useNavItems(active?.teamId);

  useEffect(() => {
    notificationRepository.unreadCount().then((result) => {
      if (result.ok) setUnreadCount(result.value.count);
    });
  }, [location.pathname]);

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

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 28, height: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          PitchMate
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, py: 1 }}>
        {navItems.map((item) => {
          const disabled = item.requiresTeam && !active;
          return (
            <ListItemButton
              key={item.path}
              selected={isActive(item.path)}
              disabled={disabled}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{ mx: 1, borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      {active && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Current team
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {active.teamName}
            </Typography>
          </Box>
        </>
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {navItems.find((item) => isActive(item.path))?.label ?? ''}
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
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

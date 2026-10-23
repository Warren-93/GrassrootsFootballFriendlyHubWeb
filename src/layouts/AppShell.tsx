import { Suspense, useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import type { TeamView } from '../api/types';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MemberGate } from './MemberGate';
import { PageFallback } from '../routes/PageFallback';
import { useAuth } from '../auth/AuthContext';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { activeTeamFrom } from '../session/activeTeamFrom';
import { useThemeMode } from '../session/ThemeModeContext';
import { notificationRepository } from '../api/notificationRepository';
import { teamRepository } from '../api/teamRepository';
import { NotificationsModal } from '../components/NotificationsModal';
import { NavDrawerContent } from './NavDrawerContent';
import { NAV_DRAWER_WIDTH, currentNavItem } from './navItems';

const DRAWER_WIDTH = NAV_DRAWER_WIDTH;

/**
 * The shell for every signed-in page: a navy navigation rail (a drawer behind
 * a menu button on phones) and a top bar with the page title, theme toggle,
 * notification bell and account menu. Onboarding routes (create-club,
 * create-team, etc.) deliberately render outside it: there's no team yet for
 * the menu to be about.
 */
export function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { resolvedMode, toggle: toggleThemeMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [myTeams, setMyTeams] = useState<TeamView[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { active, setActive, clear } = useCurrentTeam();

  function refreshUnreadCount() {
    notificationRepository.unreadCount().then((result) => {
      if (result.ok) setUnreadCount(result.value.count);
    });
  }

  useEffect(refreshUnreadCount, [location.pathname]);

  // Dashboard already shows notifications inline, so its bell keeps the old
  // full-page navigation rather than opening a modal on top of content
  // that's already there; every other page opens the modal.
  function handleBellClick() {
    if (location.pathname === '/dashboard') navigate('/notifications');
    else setNotificationsOpen(true);
  }

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
      const current = active ? mine.find((t) => t.id === active.teamId) : undefined;
      const next = activeTeamFrom(current ?? mine[0]);
      // Also fills in the flags left out when the team was set without them
      // (at onboarding, or switching squads on Club & members).
      if (!current || active?.canManage !== next.canManage || active?.canManageClub !== next.canManageClub) {
        setActive(next);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  function handleSignOut() {
    void signOut();
    clear();
    navigate('/welcome');
  }

  const currentItem = currentNavItem(location.pathname, active?.teamId);

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
              {currentItem?.label ?? ''}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={toggleThemeMode}
              aria-label={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedMode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
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
              <Divider />
              <MenuItem
                selected={location.pathname === '/dashboard'}
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
          <NavDrawerContent myTeams={myTeams} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minWidth: 0 }}>
        <Toolbar />
        <Suspense fallback={<PageFallback />}>
          <MemberGate>
            <Outlet />
          </MemberGate>
        </Suspense>
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

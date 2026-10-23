import { Box, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, MenuItem, Select, Toolbar, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TeamView } from '../api/types';
import { useCurrentTeam } from '../session/CurrentTeamContext';
import { activeTeamFrom } from '../session/activeTeamFrom';
import { brand } from '../theme/theme';
import { NAV_DRAWER_WIDTH, currentNavItem, navSections } from './navItems';
import type { NavItem } from './navItems';

const subheaderSx = { bgcolor: 'transparent', color: '#5E7466', fontSize: 10, letterSpacing: '.1em', lineHeight: 3 };

/**
 * The navy navigation menu: the shell's permanent rail on wide screens and
 * its drawer on phones, so every page shows the same menu.
 */
export function NavDrawerContent({ myTeams, onNavigate }: { myTeams: TeamView[]; onNavigate: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { active, setActive } = useCurrentTeam();
  const sections = navSections(active?.teamId);
  const current = currentNavItem(location.pathname, active?.teamId);

  function go(item: NavItem) {
    navigate(item.path);
    onNavigate();
  }

  function handleTeamSwitch(event: SelectChangeEvent) {
    const t = myTeams.find((team) => team.id === event.target.value);
    if (t) setActive(activeTeamFrom(t));
  }

  return (
    <Box sx={{ width: NAV_DRAWER_WIDTH, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: brand.void, color: '#AEC2B5' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box component="img" src="/icon-mark-reversed-transparent.png" alt="" sx={{ width: 26, height: 26, objectFit: 'contain' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff' }}>
          Kick<Box component="span" sx={{ color: brand.lime }}>about</Box>
        </Typography>
      </Toolbar>
      <List sx={{ flexGrow: 1, py: 1, overflowY: 'auto' }}>
        {sections.map(([title, items], index) => (
          <Box key={title}>
            <ListSubheader sx={{ ...subheaderSx, mt: index === 0 ? 0 : 1 }}>{title}</ListSubheader>
            {items.map((item) => (
              <ListItemButton
                key={item.path}
                selected={item.path === current?.path}
                disabled={item.requiresTeam && !active}
                onClick={() => go(item)}
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
            ))}
          </Box>
        ))}
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
}

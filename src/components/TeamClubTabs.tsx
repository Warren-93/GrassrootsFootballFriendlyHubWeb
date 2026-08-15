import { Tabs, Tab } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentTeam } from '../session/CurrentTeamContext';

/**
 * The four Team & club destinations as an in-page tab strip, matching the
 * concept's browser-frame tabstrip for this section - Team profile, Club &
 * members, Venues, Verification are one screen with four tabs there, and a
 * tab strip is the closest real-web equivalent that still keeps each tab its
 * own deep-linkable route (an MUI Tabs bar over four routes, not four routes
 * hidden behind a nav dropdown).
 */
export function TeamClubTabs() {
  const { active } = useCurrentTeam();
  const navigate = useNavigate();
  const location = useLocation();

  if (!active) return null;

  const tabs = [
    { label: 'Team profile', path: `/team/${active.teamId}` },
    { label: 'Club & members', path: '/club' },
    { label: 'Venues', path: '/venues' },
    { label: 'Verification', path: `/team/${active.teamId}/verification` },
  ];
  const activeIndex = tabs.findIndex((t) => t.path === location.pathname);

  return (
    <Tabs value={activeIndex === -1 ? false : activeIndex} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {tabs.map((t) => (
        <Tab key={t.path} label={t.label} onClick={() => navigate(t.path)} />
      ))}
    </Tabs>
  );
}

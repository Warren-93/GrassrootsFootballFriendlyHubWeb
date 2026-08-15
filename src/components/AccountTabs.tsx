import { Tabs, Tab } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { label: 'Settings', path: '/settings' },
  { label: 'Notifications', path: '/settings/notifications' },
  { label: 'Privacy & data', path: '/settings/privacy' },
  { label: 'Report & block', path: '/settings/report' },
  { label: 'Help', path: '/settings/help' },
];

/**
 * The five Account destinations as an in-page tab strip, matching the
 * concept's browser-frame tabstrip for this section - same pattern as
 * TeamClubTabs, real deep-linkable routes under one shared tab bar.
 */
export function AccountTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeIndex = TABS.findIndex((t) => t.path === location.pathname);

  return (
    <Tabs value={activeIndex === -1 ? false : activeIndex} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
      {TABS.map((t) => (
        <Tab key={t.path} label={t.label} onClick={() => navigate(t.path)} />
      ))}
    </Tabs>
  );
}

import { useNavPreference } from '../session/NavPreferenceContext';
import { AppShell } from './AppShell';
import { AppShellSidebar } from './AppShellSidebar';

/** Picks which shell chrome wraps every signed-in route, per the user's saved nav-style preference. */
export function AppShellSwitch() {
  const { navStyle } = useNavPreference();
  return navStyle === 'sidebar' ? <AppShellSidebar /> : <AppShell />;
}

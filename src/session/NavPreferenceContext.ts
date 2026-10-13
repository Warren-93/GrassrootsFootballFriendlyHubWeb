// Which app shell chrome to render: the default top nav, or the alternate
// dark-rail sidebar from the concept's "Sidebar view" - offered as a real,
// persistent preference (not a one-page illusion) since a page-scoped chrome
// swap isn't a sound pattern for an app that's navigated with a router.
// Toggled from Home's tab strip and from the account menu in either shell.
import { createContext, useContext } from 'react';

export type NavStyle = 'top' | 'sidebar';

export interface NavPreferenceContextValue {
  navStyle: NavStyle;
  setNavStyle: (style: NavStyle) => void;
}

export const NavPreferenceContext = createContext<NavPreferenceContextValue | null>(null);

export function useNavPreference(): NavPreferenceContextValue {
  const ctx = useContext(NavPreferenceContext);
  if (!ctx) throw new Error('useNavPreference must be used within NavPreferenceProvider');
  return ctx;
}

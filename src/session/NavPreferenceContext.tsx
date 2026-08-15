// Which app shell chrome to render: the default top nav, or the alternate
// dark-rail sidebar from the concept's "Sidebar view" - offered as a real,
// persistent preference (not a one-page illusion) since a page-scoped chrome
// swap isn't a sound pattern for an app that's navigated with a router.
// Toggled from Home's tab strip and from the account menu in either shell.
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type NavStyle = 'top' | 'sidebar';

const STORAGE_KEY = 'gffh.navStyle';

interface NavPreferenceContextValue {
  navStyle: NavStyle;
  setNavStyle: (style: NavStyle) => void;
}

const NavPreferenceContext = createContext<NavPreferenceContextValue | null>(null);

export function NavPreferenceProvider({ children }: { children: ReactNode }) {
  const [navStyle, setNavStyleState] = useState<NavStyle>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'sidebar' ? 'sidebar' : 'top';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, navStyle);
  }, [navStyle]);

  return (
    <NavPreferenceContext.Provider value={{ navStyle, setNavStyle: setNavStyleState }}>
      {children}
    </NavPreferenceContext.Provider>
  );
}

export function useNavPreference(): NavPreferenceContextValue {
  const ctx = useContext(NavPreferenceContext);
  if (!ctx) throw new Error('useNavPreference must be used within NavPreferenceProvider');
  return ctx;
}

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavPreferenceContext } from './NavPreferenceContext';
import type { NavStyle } from './NavPreferenceContext';

const STORAGE_KEY = 'gffh.navStyle';

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

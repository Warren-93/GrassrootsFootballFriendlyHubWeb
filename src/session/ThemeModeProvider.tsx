import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeModeContext } from './ThemeModeContext';
import type { ThemeModePreference, ResolvedThemeMode } from './ThemeModeContext';

const STORAGE_KEY = 'gffh.themeMode';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemeModePreference>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  });
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  const resolvedMode: ResolvedThemeMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  function toggle() {
    setPreference(resolvedMode === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeModeContext.Provider value={{ preference, resolvedMode, setPreference, toggle }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

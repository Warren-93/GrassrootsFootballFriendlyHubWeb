// Light/dark mode preference - defaults to following the OS setting until
// the user explicitly picks one via the toggle, then remembers that choice
// (same localStorage-backed pattern as NavPreferenceContext).
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeModePreference = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'gffh.themeMode';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

interface ThemeModeContextValue {
  preference: ThemeModePreference;
  resolvedMode: ResolvedThemeMode;
  setPreference: (pref: ThemeModePreference) => void;
  /** Flips between light and dark, overriding "system" with an explicit choice. */
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

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

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

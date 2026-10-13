// Light/dark mode preference - defaults to following the OS setting until
// the user explicitly picks one via the toggle, then remembers that choice
// (same localStorage-backed pattern as NavPreferenceContext).
import { createContext, useContext } from 'react';

export type ThemeModePreference = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

export interface ThemeModeContextValue {
  preference: ThemeModePreference;
  resolvedMode: ResolvedThemeMode;
  setPreference: (pref: ThemeModePreference) => void;
  /** Flips between light and dark, overriding "system" with an explicit choice. */
  toggle: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

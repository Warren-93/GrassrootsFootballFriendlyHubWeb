// Mirrors the mobile client's CurrentTeamStore: which team the app is acting
// as. Set once onboarding completes; every tab-root screen reads it. The spec
// assumes a "list every team I manage" endpoint for its team switcher
// (SCR-HM-01); that endpoint doesn't exist yet, so this holds only the one
// most-recently-active team, same limitation as mobile.
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface ActiveTeam {
  teamId: string;
  teamName: string;
  clubId: string;
}

const STORAGE_KEY = 'gffh.activeTeam';

interface CurrentTeamContextValue {
  active: ActiveTeam | null;
  setActive: (team: ActiveTeam | null) => void;
  clear: () => void;
}

const CurrentTeamContext = createContext<CurrentTeamContextValue | null>(null);

export function CurrentTeamProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<ActiveTeam | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveTeam) : null;
  });

  useEffect(() => {
    if (active) localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    else localStorage.removeItem(STORAGE_KEY);
  }, [active]);

  return (
    <CurrentTeamContext.Provider
      value={{ active, setActive: setActiveState, clear: () => setActiveState(null) }}
    >
      {children}
    </CurrentTeamContext.Provider>
  );
}

export function useCurrentTeam(): CurrentTeamContextValue {
  const ctx = useContext(CurrentTeamContext);
  if (!ctx) throw new Error('useCurrentTeam must be used within CurrentTeamProvider');
  return ctx;
}

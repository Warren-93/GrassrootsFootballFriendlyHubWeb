// Mirrors the mobile client's CurrentTeamStore: which team the app is acting
// as. Set once onboarding completes; every tab-root screen reads it and
// AppShell reconciles it against GET /api/v1/teams/mine on every signed-in
// session, offering a real switcher (a Select in the account menu) whenever
// that call returns more than one team.
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

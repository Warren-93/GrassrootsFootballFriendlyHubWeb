// Mirrors the mobile client's CurrentTeamStore: which team the app is acting
// as. Set once onboarding completes; every tab-root screen reads it and
// AppShell reconciles it against GET /api/v1/teams/mine on every signed-in
// session, offering a real switcher (a Select in the account menu) whenever
// that call returns more than one team.
import { createContext, useContext } from 'react';

export interface ActiveTeam {
  teamId: string;
  teamName: string;
  clubId: string;
}

export interface CurrentTeamContextValue {
  active: ActiveTeam | null;
  setActive: (team: ActiveTeam | null) => void;
  clear: () => void;
}

export const CurrentTeamContext = createContext<CurrentTeamContextValue | null>(null);

export function useCurrentTeam(): CurrentTeamContextValue {
  const ctx = useContext(CurrentTeamContext);
  if (!ctx) throw new Error('useCurrentTeam must be used within CurrentTeamProvider');
  return ctx;
}

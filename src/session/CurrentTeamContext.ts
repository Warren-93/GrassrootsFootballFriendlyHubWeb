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
  /**
   * False for a member who joined with a code (role USER): they can't manage
   * the team, so the app shows them a read-only view. Missing means true, for
   * teams cached before this field existed.
   */
  canManage?: boolean;
  /**
   * False for anyone who isn't the club's admin, a team manager included:
   * only a club admin can add or change the club's venues, so the app shows
   * them read-only. Missing means true, for teams cached before this field
   * existed; AppShell fills it in from GET /teams/mine.
   */
  canManageClub?: boolean;
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

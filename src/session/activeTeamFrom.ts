import type { TeamView } from '../api/types';
import type { ActiveTeam } from './CurrentTeamContext';

/** The active team for one of GET /teams/mine's teams. An older API leaves the flags out, which means true. */
export function activeTeamFrom(t: TeamView): ActiveTeam {
  return {
    teamId: t.id,
    teamName: t.name,
    clubId: t.clubId,
    canManage: t.canManage ?? true,
    canManageClub: t.canManageClub ?? true,
  };
}

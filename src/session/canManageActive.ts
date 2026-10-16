import type { ActiveTeam } from './CurrentTeamContext';

/** Whether the user can manage the team they're acting as (false for a member who joined with a code). */
export function canManageActive(active: ActiveTeam | null): boolean {
  return !!active && active.canManage !== false;
}

/** Whether the user is the admin of the active team's club, the only role that can add or change its venues. */
export function canManageActiveClub(active: ActiveTeam | null): boolean {
  return canManageActive(active) && active?.canManageClub !== false;
}

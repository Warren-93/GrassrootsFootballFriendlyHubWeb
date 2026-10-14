import type { ActiveTeam } from './CurrentTeamContext';

/** Whether the user can manage the team they're acting as (false for a member who joined with a code). */
export function canManageActive(active: ActiveTeam | null): boolean {
  return !!active && active.canManage !== false;
}

import { useEffect, useState } from 'react';
import { leagueRepository } from '../api/leagueRepository';
import type { LeagueView } from '../api/types';

/**
 * The active team's leagues, for the League menu. Reloaded when `refreshKey`
 * changes (the shells pass the current path), so a league added on the
 * Leagues page shows up in the menu straight away.
 */
export function useLeagues(teamId: string | undefined, refreshKey?: string): LeagueView[] {
  const [leagues, setLeagues] = useState<LeagueView[]>([]);
  useEffect(() => {
    if (!teamId) {
      setLeagues([]);
      return;
    }
    leagueRepository.list(teamId).then((result) => {
      if (result.ok) setLeagues(result.value);
    });
  }, [teamId, refreshKey]);
  return leagues;
}

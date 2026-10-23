import type { MatchType } from '../api/types';

/** True for a league fixture or request. An older API leaves the type out, which means a friendly. */
export function isLeague(item: { type?: MatchType } | null | undefined): boolean {
  return item?.type === 'LEAGUE';
}

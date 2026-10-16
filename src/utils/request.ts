import type { ApiResult } from '../api/result';
import type { FriendlyRequestView, TeamRef } from '../api/types';

/** The id of the team on the other side of a request from ours. */
export function opponentTeamId(request: FriendlyRequestView, teamId: string): string {
  return request.senderTeamId === teamId ? request.recipientTeamId : request.senderTeamId;
}

/** The other team as the request names it - null from an older API that doesn't send the team refs. */
export function opponentRef(request: FriendlyRequestView, teamId: string): TeamRef | null {
  return (request.senderTeamId === teamId ? request.recipientTeam : request.senderTeam) ?? null;
}

/**
 * The other team's name for each request, keyed by request id. Requests carry
 * both teams' names now, so this only looks a team up (once per team) when an
 * older API left them out.
 */
export async function opponentNames(
  requests: FriendlyRequestView[],
  teamId: string,
  getTeam: (teamId: string) => Promise<ApiResult<{ name: string }>>,
): Promise<Record<string, string>> {
  const missing = [
    ...new Set(requests.filter((r) => !opponentRef(r, teamId)?.name).map((r) => opponentTeamId(r, teamId))),
  ];
  const lookedUp: Record<string, string> = Object.fromEntries(
    await Promise.all(
      missing.map(async (id) => {
        const result = await getTeam(id);
        return [id, result.ok ? result.value.name : 'Opponent'] as const;
      }),
    ),
  );
  return Object.fromEntries(
    requests.map((r) => [r.id, opponentRef(r, teamId)?.name || lookedUp[opponentTeamId(r, teamId)]]),
  );
}

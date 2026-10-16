import { describe, expect, it, vi } from 'vitest';
import { opponentNames, opponentRef, opponentTeamId } from './request';
import type { FriendlyRequestView } from '../api/types';

function request(id: string, senderTeamId: string, recipientTeamId: string, withRefs = true): FriendlyRequestView {
  return {
    id,
    senderTeamId,
    recipientTeamId,
    status: 'SENT',
    date: '2026-11-07',
    startTime: '10:00:00',
    endTime: '11:30:00',
    venueId: null,
    homeTeamId: senderTeamId,
    awayTeamId: recipientTeamId,
    costShare: 'SPLIT',
    refereeArrangement: 'NONE',
    message: null,
    actionReason: null,
    availableActions: ['withdraw'],
    senderContact: null,
    recipientContact: null,
    proposedStartTime: null,
    proposedEndTime: null,
    proposedVenueId: null,
    ...(withRefs
      ? {
          senderTeam: { id: senderTeamId, name: `Team ${senderTeamId}`, clubName: null, badgeUrl: null },
          recipientTeam: { id: recipientTeamId, name: `Team ${recipientTeamId}`, clubName: null, badgeUrl: null },
        }
      : {}),
  };
}

describe('opponentTeamId and opponentRef', () => {
  it('pick the other side whichever way the request went', () => {
    expect(opponentTeamId(request('r1', 'us', 'them'), 'us')).toBe('them');
    expect(opponentTeamId(request('r1', 'them', 'us'), 'us')).toBe('them');
    expect(opponentRef(request('r1', 'them', 'us'), 'us')?.name).toBe('Team them');
  });

  it('is null when an older API sends no team refs', () => {
    expect(opponentRef(request('r1', 'us', 'them', false), 'us')).toBeNull();
  });
});

describe('opponentNames', () => {
  it('uses the names on the requests without looking any team up', async () => {
    const getTeam = vi.fn();
    const names = await opponentNames([request('r1', 'us', 'a'), request('r2', 'b', 'us')], 'us', getTeam);

    expect(names).toEqual({ r1: 'Team a', r2: 'Team b' });
    expect(getTeam).not.toHaveBeenCalled();
  });

  it('looks each missing team up once when an older API leaves the names out', async () => {
    const getTeam = vi.fn(async (id: string) =>
      id === 'a' ? { ok: true as const, value: { name: 'Ardingly Acorns' } } : { ok: false as const, message: 'Not found' },
    );
    const names = await opponentNames(
      [request('r1', 'us', 'a', false), request('r2', 'a', 'us', false), request('r3', 'us', 'gone', false), request('r4', 'us', 'b')],
      'us',
      getTeam,
    );

    expect(names).toEqual({ r1: 'Ardingly Acorns', r2: 'Ardingly Acorns', r3: 'Opponent', r4: 'Team b' });
    expect(getTeam).toHaveBeenCalledTimes(2);
    expect(getTeam).toHaveBeenCalledWith('a');
    expect(getTeam).toHaveBeenCalledWith('gone');
  });
});

import { describe, expect, it } from 'vitest';
import { fixtureSide, localDateIso, upcomingFixtures } from './fixture';
import type { FixtureStatus, FixtureView } from '../api/types';

function fixture(id: string, date: string, startTime: string, status: FixtureStatus = 'CONFIRMED'): FixtureView {
  return {
    id,
    friendlyRequestId: `request-${id}`,
    homeTeam: { id: 'us', name: 'Riverside U12 Girls', clubName: 'Riverside FC', managerName: null, contactPhone: null, venueId: null },
    awayTeam: { id: 'them', name: 'Haywards Heath Harriers', clubName: 'Harriers FC', managerName: null, contactPhone: null, venueId: null },
    date,
    startTime,
    endTime: '11:30:00',
    venueId: null,
    status,
    costShare: 'SPLIT',
    refereeArrangement: 'NONE',
  };
}

describe('localDateIso', () => {
  it("formats the browser's local date", () => {
    expect(localDateIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('upcomingFixtures', () => {
  it('keeps confirmed fixtures from today on, soonest kick-off first', () => {
    const fixtures = [
      fixture('later', '2026-11-14', '10:00:00'),
      fixture('past', '2026-10-10', '10:00:00'),
      fixture('afternoon', '2026-11-07', '14:00:00'),
      fixture('cancelled', '2026-11-01', '10:00:00', 'CANCELLED'),
      fixture('today', '2026-10-16', '18:30:00'),
      fixture('morning', '2026-11-07', '09:30:00'),
    ];

    expect(upcomingFixtures(fixtures, '2026-10-16').map((f) => f.id)).toEqual(['today', 'morning', 'afternoon', 'later']);
  });
});

describe('fixtureSide', () => {
  it('names the opponent and whether the team is at home', () => {
    const f = fixture('f1', '2026-11-07', '10:00:00');

    expect(fixtureSide(f, 'us')).toEqual({ opponent: f.awayTeam, home: true });
    expect(fixtureSide(f, 'them')).toEqual({ opponent: f.homeTeam, home: false });
  });
});

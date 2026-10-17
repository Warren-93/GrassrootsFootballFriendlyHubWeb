import { describe, expect, it } from 'vitest';
import { withSentMessages } from './conversation';
import type { ConversationView, MessageView } from '../api/types';

function conversation(id: string, lastMessageAt: string | null, lastMessageBody: string | null = null): ConversationView {
  return {
    id,
    otherTeam: {
      id: `team-${id}`,
      name: `Team ${id}`,
      clubName: 'Club',
      badgeUrl: null,
      ageGroup: 'U12',
      gender: 'GIRLS',
      format: 'NINE_A_SIDE',
      abilityLevel: 'DIVISION_2',
      league: null,
      description: null,
      generalArea: null,
      verified: true,
    },
    lastMessageBody,
    lastMessageSenderTeamId: lastMessageBody ? `team-${id}` : null,
    lastMessageAt,
    createdAt: '2026-10-01T09:00:00Z',
    relatedFixtureId: null,
  };
}

function message(conversationId: string, body: string, createdAt: string): MessageView {
  return { id: `m-${body}`, conversationId, senderTeamId: 'team-1', senderUserId: 'user-1', body, createdAt };
}

describe('withSentMessages', () => {
  it('shows the first message sent in a new conversation and moves it to the top', () => {
    const list = [conversation('a', '2026-10-15T10:00:00Z', 'See you Saturday'), conversation('b', null)];

    const shown = withSentMessages(list, { b: message('b', 'Hello from Riverside', '2026-10-16T08:00:00.123456Z') });

    expect(shown.map((c) => c.id)).toEqual(['b', 'a']);
    expect(shown[0]).toMatchObject({
      lastMessageBody: 'Hello from Riverside',
      lastMessageSenderTeamId: 'team-1',
      lastMessageAt: '2026-10-16T08:00:00.123456Z',
    });
    expect(shown[1]).toBe(list[0]);
  });

  it('keeps the fetched preview when it is already as new as the message sent', () => {
    const list = [conversation('a', '2026-10-16T08:00:00Z', 'Hello from Riverside')];

    expect(withSentMessages(list, { a: message('a', 'Hello from Riverside', '2026-10-16T08:00:00Z') })).toEqual(list);
  });

  it('puts the most recently sent first when several threads had messages sent', () => {
    const list = [conversation('a', null), conversation('b', null), conversation('c', null)];

    const shown = withSentMessages(list, {
      a: message('a', 'first', '2026-10-16T08:00:00Z'),
      c: message('c', 'second', '2026-10-16T08:05:00Z'),
    });

    expect(shown.map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });
});

import { describe, expect, it } from 'vitest';
import type { MessageView } from '../../api/types';
import { ACTIVE_POLL_MS, IDLE_AFTER_MS, IDLE_POLL_MS, mergeMessages, nextPollDelay, pollSince } from './chatPolling';

function message(id: string, createdAt: string): MessageView {
  return { id, conversationId: 'c1', senderTeamId: 't1', senderUserId: 'u1', body: id, createdAt };
}

describe('mergeMessages', () => {
  it('adds new messages and drops the repeated newest one', () => {
    const current = [message('a', '2026-10-22T10:00:00Z'), message('b', '2026-10-22T10:00:01.5Z')];
    const incoming = [message('b', '2026-10-22T10:00:01.5Z'), message('c', '2026-10-22T10:00:02Z')];
    expect(mergeMessages(current, incoming).map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the same list when nothing is new, so React skips a re-render', () => {
    const current = [message('a', '2026-10-22T10:00:00Z')];
    expect(mergeMessages(current, [message('a', '2026-10-22T10:00:00Z')])).toBe(current);
    expect(mergeMessages(current, [])).toBe(current);
  });

  it('orders by time even when timestamps carry different decimal places', () => {
    const current = [message('a', '2026-10-22T10:00:00.9Z')];
    const merged = mergeMessages(current, [message('b', '2026-10-22T10:00:01Z'), message('c', '2026-10-22T10:00:00.95Z')]);
    expect(merged.map((m) => m.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('pollSince', () => {
  it('is the newest message time, or nothing for an empty chat', () => {
    expect(pollSince([])).toBeUndefined();
    expect(pollSince([message('a', 'x'), message('b', 'y')])).toBe('y');
  });
});

describe('nextPollDelay', () => {
  it('polls quickly while the chat is active and slows once it is quiet', () => {
    expect(nextPollDelay(1000, 1000 + IDLE_AFTER_MS - 1)).toBe(ACTIVE_POLL_MS);
    expect(nextPollDelay(1000, 1000 + IDLE_AFTER_MS)).toBe(IDLE_POLL_MS);
  });
});

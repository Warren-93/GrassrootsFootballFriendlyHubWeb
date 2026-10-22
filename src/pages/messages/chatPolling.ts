import type { MessageView } from '../../api/types';

/** How often an open chat checks for new messages while it's lively. */
export const ACTIVE_POLL_MS = 4000;
/** How often it checks once nothing has arrived for {@link IDLE_AFTER_MS}. */
export const IDLE_POLL_MS = 15000;
/** Quiet time after which polling slows to {@link IDLE_POLL_MS}. */
export const IDLE_AFTER_MS = 60000;

/**
 * Adds newly fetched messages to those already shown. A poll asks only for
 * messages since the newest one held, and the API includes that one too, so
 * duplicates are dropped by id and the result stays oldest first.
 */
export function mergeMessages(current: MessageView[], incoming: MessageView[]): MessageView[] {
  if (incoming.length === 0) return current;
  const known = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !known.has(m.id));
  if (added.length === 0) return current;
  // Compared as times: the API's timestamps vary in how many decimal places they carry.
  return [...current, ...added].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/** The time to poll from: the newest message held, or none to fetch the whole history. */
export function pollSince(messages: MessageView[]): string | undefined {
  return messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
}

/** Polls quickly while messages are arriving, and slows down once the chat goes quiet. */
export function nextPollDelay(lastActivityAt: number, now: number): number {
  return now - lastActivityAt < IDLE_AFTER_MS ? ACTIVE_POLL_MS : IDLE_POLL_MS;
}

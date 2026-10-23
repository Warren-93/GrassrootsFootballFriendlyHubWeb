// Date helpers for SCR-AV-04 Bulk add availability. All dates are ISO
// yyyy-mm-dd strings, which sort correctly as plain strings.

/** The API accepts at most this many dates in one bulk publish. */
export const MAX_BULK_DATES = 52;

export function datesMatchingWeekdays(fromIso: string, toIso: string, weekdays: Set<number>): string[] {
  const dates: string[] = [];
  const cursor = new Date(fromIso);
  const end = new Date(toIso);
  while (cursor <= end) {
    if (weekdays.has(cursor.getDay())) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export type AddDateOutcome = { ok: true; dates: string[] } | { ok: false; reason: string };

/**
 * Adds one hand-picked date to the list, keeping it sorted and free of
 * duplicates. Past dates are refused here rather than left for the API to
 * skip, so the count on the Publish button is what actually gets published.
 */
export function addPickedDate(dates: string[], iso: string, todayIso: string): AddDateOutcome {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { ok: false, reason: 'Pick a date first.' };
  if (iso < todayIso) return { ok: false, reason: 'That date has already passed.' };
  if (dates.includes(iso)) return { ok: false, reason: 'That date is already in the list.' };
  if (dates.length >= MAX_BULK_DATES) {
    return {
      ok: false,
      reason: `You can publish up to ${MAX_BULK_DATES} dates at once.`,
    };
  }
  return { ok: true, dates: [...dates, iso].sort() };
}

/** "Sat, 24 Oct 2026" - read as a calendar date, so no timezone shift. */
export function formatPickedDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

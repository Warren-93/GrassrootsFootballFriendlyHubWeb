import { describe, expect, it } from 'vitest';
import { addPickedDate, formatPickedDate, MAX_BULK_DATES } from './bulkDates';

const TODAY = '2026-10-23';

describe('addPickedDate', () => {
  it('adds dates in date order, whatever order they are picked in', () => {
    let dates: string[] = [];
    for (const d of ['2026-11-14', '2026-10-31', '2026-11-07']) {
      const outcome = addPickedDate(dates, d, TODAY);
      if (!outcome.ok) throw new Error(outcome.reason);
      dates = outcome.dates;
    }
    expect(dates).toEqual(['2026-10-31', '2026-11-07', '2026-11-14']);
  });

  it('allows today but refuses a past date', () => {
    expect(addPickedDate([], TODAY, TODAY)).toEqual({ ok: true, dates: [TODAY] });
    expect(addPickedDate([], '2026-10-22', TODAY)).toEqual({ ok: false, reason: 'That date has already passed.' });
  });

  it('refuses a date already in the list', () => {
    expect(addPickedDate(['2026-10-31'], '2026-10-31', TODAY)).toEqual({
      ok: false,
      reason: 'That date is already in the list.',
    });
  });

  it('refuses an empty or half-typed date', () => {
    expect(addPickedDate([], '', TODAY).ok).toBe(false);
    expect(addPickedDate([], '2026-1', TODAY).ok).toBe(false);
  });

  it('stops at the API limit', () => {
    const full = Array.from({ length: MAX_BULK_DATES }, (_, i) => `placeholder-${i}`);
    expect(addPickedDate(full, '2028-01-01', TODAY)).toEqual({
      ok: false,
      reason: `You can publish up to ${MAX_BULK_DATES} dates at once.`,
    });
  });
});

describe('formatPickedDate', () => {
  it('shows the weekday with the date', () => {
    expect(formatPickedDate('2026-10-31')).toBe('Sat, 31 Oct 2026');
  });
});

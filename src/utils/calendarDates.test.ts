import { describe, expect, it } from 'vitest';
import { calendarMonthBounds, calendarMonthCells } from './calendarDates';

describe('calendar date grid', () => {
  it('keeps October 2026 dates in their correct weekday columns', () => {
    const cells = calendarMonthCells(2026, 9);
    const first = cells.findIndex((cell) => cell.date === '2026-10-01');
    const twentyFifth = cells.findIndex((cell) => cell.date === '2026-10-25');

    expect(first).toBe(3); // Thursday, Monday-first columns
    expect(twentyFifth).toBe(27); // Sunday
    expect(cells[twentyFifth]).toEqual({ date: '2026-10-25', inMonth: true });
    expect(cells).toHaveLength(35);
  });

  it('uses local dates for the availability query bounds', () => {
    expect(calendarMonthBounds(new Date(2026, 9, 1))).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    });
  });
});

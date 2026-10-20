export type CalendarCell = { date: string; inMonth: boolean };

/** Format a local calendar date without converting midnight to UTC. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calendarMonthBounds(cursor: Date): { start: string; end: string } {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  return {
    start: localDateKey(new Date(year, month, 1)),
    end: localDateKey(new Date(year, month + 1, 0)),
  };
}

/** Build complete Monday-first calendar weeks using local dates throughout. */
export function calendarMonthCells(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  for (let day = 1 - leadingDays; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ date: localDateKey(date), inMonth: date.getMonth() === month });
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - leadingDays - daysInMonth + 1;
    const date = new Date(year, month + 1, day);
    cells.push({ date: localDateKey(date), inMonth: false });
  }
  return cells;
}

import type { FixtureTeamView, FixtureView } from '../api/types';

/** Today as yyyy-mm-dd in the browser's own time zone, to compare with a fixture's date. */
export function localDateIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Confirmed fixtures from today on, soonest kick-off first. */
export function upcomingFixtures(fixtures: FixtureView[], today: string): FixtureView[] {
  return fixtures
    .filter((f) => f.status === 'CONFIRMED' && f.date >= today)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
}

/** A fixture from one team's side: who they play, and whether they're at home. */
export function fixtureSide(fixture: FixtureView, teamId: string): { opponent: FixtureTeamView; home: boolean } {
  const home = fixture.homeTeam.id === teamId;
  return { opponent: home ? fixture.awayTeam : fixture.homeTeam, home };
}

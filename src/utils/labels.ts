import type { AbilityLevel, AgeGroup, Organisation } from '../api/types';

// The API's enum codes as people say them ("U12", "Boys", "9v9", "No
// preference", "Changes requested"), for every screen that shows one. Any
// other code - including one the API adds later - just loses its underscores
// and capitals ("HOST_PAYS" reads "Host pays"), so nothing is shown raw.
// Mirrors the mobile client's codeLabel.
const KNOWN_LABELS: Record<string, string> = {
  FIVE_A_SIDE: '5v5',
  SEVEN_A_SIDE: '7v7',
  NINE_A_SIDE: '9v9',
  ELEVEN_A_SIDE: '11v11',
  EITHER: 'No preference',
  NOT_STARTED: 'Not verified',
  PENDING: 'Under review',
  AWAITING_SECOND_REJECTION: 'Under review',
  SENT: 'Awaiting reply',
  UPDATED: 'Changes accepted',
  USER: 'Member',
  PREMIER: 'Premier / top division',
  DIVISION_1: 'Division 1 / Championship',
  DIVISION_2: 'Division 2',
  DIVISION_3_PLUS: 'Division 3 or lower',
  NOT_IN_LEAGUE: 'Not in a league',
  FESTIVAL: 'Festival / non-competitive',
  SYFA: 'Scottish Youth FA (SYFA)',
  SAFA: 'Scottish Amateur FA (SAFA)',
  SWF: "Scottish Women's Football (SWF)",
  SWFA: 'Scottish Welfare FA (SWFA)',
  SSFA: "Scottish Schools' FA (SSFA)",
  SJFA: 'Scottish Junior FA (SJFA)',
};

export function codeLabel(code: string): string {
  if (KNOWN_LABELS[code]) return KNOWN_LABELS[code];
  // Already a display label (the match results send "Division 1 / Championship").
  if (/[a-z]/.test(code)) return code;
  if (/^U\d+$/.test(code)) return code;
  const words = code.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "NONE" means different things for a referee and a cost share. */
export function refereeLabel(code: string): string {
  if (code === 'NONE') return 'No referee';
  if (code === 'APPOINTED') return 'Appointed referee';
  return codeLabel(code);
}

export function costShareLabel(code: string): string {
  return code === 'NONE' ? 'No costs' : codeLabel(code);
}

/** "2026-10-24" -> "Sat, 24 Oct 2026", read as a calendar date (no timezone shift). */
export function dateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Pick-list order for the team's division, top first. */
export const DIVISIONS: AbilityLevel[] = ['PREMIER', 'DIVISION_1', 'DIVISION_2', 'DIVISION_3_PLUS', 'NOT_IN_LEAGUE', 'FESTIVAL'];

// The Scottish FA associations a team of this age can play under. Mirrors
// backend Organisation.availableFor(AgeGroup): youth, schools and girls'
// bodies for youth teams; amateur, welfare, junior and women's for adults.
export function organisationsFor(ageGroup: AgeGroup): Organisation[] {
  return ageGroup === 'ADULT' || ageGroup === 'VETERANS'
    ? ['SAFA', 'SWF', 'SWFA', 'SJFA', 'OTHER']
    : ['SYFA', 'SWF', 'SSFA', 'OTHER'];
}

/** OTHER means "Other" elsewhere (a report reason), so the organisation's wording lives here. */
export function organisationLabel(code: string): string {
  return code === 'OTHER' ? 'Other / not affiliated' : codeLabel(code);
}

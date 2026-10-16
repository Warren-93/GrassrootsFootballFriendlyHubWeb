/**
 * A phone number with non-breaking spaces, for the contact rows on requests
 * and fixtures: when a long team name squeezes the row on a phone, the
 * manager's name wraps rather than the number splitting across two lines.
 */
export function unbrokenPhone(phone: string | null | undefined): string {
  return (phone ?? '').trim().replace(/\s+/g, ' ');
}

/** A manager's name and number for a contact row, or "Not given" when the team has shared neither. */
export function contactLine(managerName: string | null | undefined, phone: string | null | undefined): string {
  return [managerName?.trim(), unbrokenPhone(phone)].filter(Boolean).join(' ') || 'Not given';
}

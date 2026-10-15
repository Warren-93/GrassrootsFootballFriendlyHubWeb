/**
 * A phone number with non-breaking spaces, for the contact rows on requests
 * and fixtures: when a long team name squeezes the row on a phone, the
 * manager's name wraps rather than the number splitting across two lines.
 */
export function unbrokenPhone(phone: string | null | undefined): string {
  return (phone ?? '').trim().replace(/\s+/g, ' ');
}

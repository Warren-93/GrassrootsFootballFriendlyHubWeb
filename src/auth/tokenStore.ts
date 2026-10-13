// Tokens live in memory only, never in web storage where any script on the
// page could read them. The refresh token normally isn't here at all: the API
// keeps it in an httpOnly cookie and the client restores a session by calling
// refresh with that cookie. It is only held here when the API returned it in
// the body instead (a Vercel preview, whose origin the API won't trust with
// the cookie), and then lasts until the page is reloaded.
const LEGACY_ACCESS_KEY = 'gffh.accessToken';
const LEGACY_REFRESH_KEY = 'gffh.refreshToken';

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Before the cookie login, both tokens were kept in localStorage. Move an
// existing refresh token into memory once, so the first refresh can swap it
// for a cookie without signing anyone out, and wipe the stored copies.
try {
  refreshToken = localStorage.getItem(LEGACY_REFRESH_KEY);
  localStorage.removeItem(LEGACY_ACCESS_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
} catch {
  // Storage unavailable (private mode, blocked site data): nothing to migrate.
}

export const tokenStore = {
  accessToken(): string | null {
    return accessToken;
  },
  refreshToken(): string | null {
    return refreshToken;
  },
  set(newAccessToken: string, newRefreshToken?: string | null) {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken ?? null;
  },
  clear() {
    accessToken = null;
    refreshToken = null;
  },
};

// The access token lives in memory only, and the refresh token never reaches
// script at all: the API keeps it in an httpOnly cookie (cookie mode, see
// AUTH_MODE_HEADER). A page reload therefore starts with no access token and
// restores the session by refreshing - see AuthContext.resolveSession.
let accessToken: string | null = null;

// Earlier builds kept both tokens in localStorage; remove them so a refresh
// token readable by script doesn't linger in returning users' browsers.
try {
  localStorage.removeItem('gffh.accessToken');
  localStorage.removeItem('gffh.refreshToken');
} catch {
  // Storage can be unavailable (private mode, blocked site data) - nothing to clean up then.
}

export const tokenStore = {
  accessToken(): string | null {
    return accessToken;
  },
  set(token: string) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};

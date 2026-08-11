const ACCESS_KEY = 'gffh.accessToken';
const REFRESH_KEY = 'gffh.refreshToken';

export const tokenStore = {
  accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

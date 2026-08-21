// Minimal token store shared between apiClient (attaches/refreshes tokens) and
// AuthContext (owns login/logout) without a circular import between the two.
const ACCESS_KEY = "punchcloud.accessToken";
const REFRESH_KEY = "punchcloud.refreshToken";

export const tokenStore = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

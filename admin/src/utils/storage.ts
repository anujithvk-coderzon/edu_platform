// Token storage for the admin app.
//
// iOS Safari blocks third-party cookies, so the `admin_token` cookie set by the
// backend never survives on iPhone. The backend also accepts
// `Authorization: Bearer`, so the token is kept here and sent as a header.
//
// The key is deliberately distinct from the student app's `student_auth_token`
// so the two never collide if they are ever served from the same origin.

const ADMIN_TOKEN_KEY = 'admin_auth_token';

export const adminStorage = {
  getToken(): string | null {
    // Guarded for SSR, where localStorage does not exist.
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
};

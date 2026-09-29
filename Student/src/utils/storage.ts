// Utility functions for managing student-specific storage
// This ensures complete separation from tutor authentication

const STUDENT_TOKEN_KEY = 'student_auth_token';
const STUDENT_USER_KEY = 'student_user_data';

// Safari throws on localStorage access in Private Browsing, and can also throw
// when the origin's storage is full or blocked. An unguarded setItem would
// reject inside the login handler and surface as a failed sign-in, so every
// access is wrapped. A failed write degrades to cookie-only auth rather than
// breaking login outright.
const readKey = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeKey = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; nothing else to do.
  }
};

const removeKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable; nothing else to do.
  }
};

export const studentStorage = {
  // Token management
  getToken(): string | null {
    return readKey(STUDENT_TOKEN_KEY);
  },

  setToken(token: string): void {
    writeKey(STUDENT_TOKEN_KEY, token);
  },

  removeToken(): void {
    removeKey(STUDENT_TOKEN_KEY);
  },

  // User data management
  getUser(): any {
    const userData = readKey(STUDENT_USER_KEY);
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  },

  setUser(user: any): void {
    writeKey(STUDENT_USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    removeKey(STUDENT_USER_KEY);
  },

  // Clear all student data (use only for logout, not initialization)
  clearStudentData(): void {
    this.removeToken();
    this.removeUser();
  },

  // Get a clean initial state for students (don't interfere with tutor cookies)
  initializeStudentAuth(): void {
    // Only clear student-specific storage, leave tutor cookies alone
    this.removeToken();
    this.removeUser();
  }
};
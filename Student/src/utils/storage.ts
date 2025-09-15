// Utility functions for managing student-specific storage
// This ensures complete separation from tutor authentication

const STUDENT_TOKEN_KEY = 'student_auth_token';
const STUDENT_USER_KEY = 'student_user_data';

export const studentStorage = {
  // Token management
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STUDENT_TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STUDENT_TOKEN_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STUDENT_TOKEN_KEY);
  },

  // User data management
  getUser(): any {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(STUDENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  setUser(user: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STUDENT_USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STUDENT_USER_KEY);
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
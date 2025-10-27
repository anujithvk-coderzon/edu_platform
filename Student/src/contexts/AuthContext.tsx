'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../lib/api';
import { studentStorage } from '../utils/storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  education?: string;
  hasPassword?: boolean; // False for OAuth users (Google/GitHub)
  institution?: string;
  occupation?: string;
  company?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API functions using the backend
const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.auth.login({ email, password });
    if (response.success && response.data.user) {
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        avatar: response.data.user.avatar,
        phone: response.data.user.phone,
        dateOfBirth: response.data.user.dateOfBirth,
        gender: response.data.user.gender,
        city: response.data.user.city,
        education: response.data.user.education,
        hasPassword: response.data.user.hasPassword,
        institution: response.data.user.institution,
        occupation: response.data.user.occupation,
        company: response.data.user.company,
        isVerified: response.data.user.isVerified,
        createdAt: response.data.user.createdAt,
        updatedAt: response.data.user.updatedAt
      };
      return user;
    }
    throw new Error(response.error?.message || 'Login failed');
  },
  
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.auth.register(data);
    if (response.success && response.data.user) {
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        avatar: response.data.user.avatar,
        phone: response.data.user.phone,
        dateOfBirth: response.data.user.dateOfBirth,
        gender: response.data.user.gender,
        city: response.data.user.city,
        education: response.data.user.education,
        hasPassword: response.data.user.hasPassword,
        institution: response.data.user.institution,
        occupation: response.data.user.occupation,
        company: response.data.user.company,
        isVerified: response.data.user.isVerified,
        createdAt: response.data.user.createdAt,
        updatedAt: response.data.user.updatedAt
      };
      return user;
    }
    throw new Error(response.error?.message || 'Registration failed');
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.auth.getMe();
      if (response.success && response.data.user) {
        const user: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          avatar: response.data.user.avatar,
          phone: response.data.user.phone,
          dateOfBirth: response.data.user.dateOfBirth,
          gender: response.data.user.gender,
          city: response.data.user.city,
          education: response.data.user.education,
          hasPassword: response.data.user.hasPassword,
          institution: response.data.user.institution,
          occupation: response.data.user.occupation,
          company: response.data.user.company,
          isVerified: response.data.user.isVerified,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt
        };
        return user;
      }
    } catch (error) {
      // Don't log 401 errors as they're expected when user is not logged in
      const errorMessage = error instanceof Error ? error.message : '';

      // Handle session expired error
      if (errorMessage.includes('logged in from another device')) {
        studentStorage.clearStudentData();
        return null;
      }

      if (!errorMessage.includes('401') && !errorMessage.includes('Access denied')) {
      }
    }
    return null;
  },
  
  logout: async (): Promise<void> => {
    await api.auth.logout();
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.auth.updateProfile(data);
    if (response.success && response.data.user) {
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        avatar: response.data.user.avatar,
        phone: response.data.user.phone,
        dateOfBirth: response.data.user.dateOfBirth,
        gender: response.data.user.gender,
        city: response.data.user.city,
        education: response.data.user.education,
        hasPassword: response.data.user.hasPassword,
        institution: response.data.user.institution,
        occupation: response.data.user.occupation,
        company: response.data.user.company,
        isVerified: response.data.user.isVerified,
        createdAt: response.data.user.createdAt,
        updatedAt: response.data.user.updatedAt
      };
      return user;
    }
    throw new Error(response.error?.message || 'Profile update failed');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get current user from cookie-based auth
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // No need to clear localStorage tokens since we use cookies now
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Check session validity on navigation
  useEffect(() => {
    if (!user || !pathname) return;

    // Skip session check on auth pages
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) return;

    const checkSession = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!currentUser) {
          // Session is invalid, log out
          setUser(null);
          window.location.href = '/login?session_expired=true';
        }
      } catch (error) {
        // Session check failed, likely logged out from another device
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('logged in from another device') || errorMessage.includes('Session expired')) {
          setUser(null);
          studentStorage.clearStudentData();
          window.location.href = '/login?session_expired=true';
        }
      }
    };

    checkSession();
  }, [pathname, user?.id]);

  const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
    setLoading(true);
    try {
      const user = await authApi.login(email, password);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setLoading(true);
    try {
      const user = await authApi.register(data);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
      // Backend clears student_token cookie automatically
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
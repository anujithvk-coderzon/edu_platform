'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN';
  avatar?: string;
  bio?: string;
  timezone?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { api } from '../lib/api';

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
        role: response.data.user.role as 'ADMIN',
        avatar: response.data.user.avatar,
        isVerified: response.data.user.isVerified
      };
      return user;
    }
    throw new Error(response.error?.message || 'Login failed');
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
          role: response.data.user.role as 'ADMIN',
          avatar: response.data.user.avatar,
          isVerified: response.data.user.isVerified
        };
        return user;
      }
    } catch (error: any) {
      // Don't log 401 errors as they're expected when user is not logged in
      if (!error?.message?.includes('401') && !error?.message?.includes('Access denied')) {
        console.error('Error getting current user:', error);
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
        role: response.data.user.role as 'ADMIN',
        avatar: response.data.user.avatar,
        isVerified: response.data.user.isVerified
      };
      return user;
    }
    throw new Error(response.error?.message || 'Profile update failed');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const user = await authApi.login(email, password);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };


  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
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
    updateProfile,
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
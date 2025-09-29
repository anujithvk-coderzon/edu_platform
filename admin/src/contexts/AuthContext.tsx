'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  isVerified: boolean;
}

interface LoginData {
  email: string;
  password: string;
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

// API functions using the backend with improved error handling
const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const response = await api.auth.login({ email, password });
      if (response.success && response.data.user) {
        const user: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          role: response.data.user.role,
          avatar: response.data.user.avatar,
          isVerified: response.data.user.isVerified
        };
        return user;
      }
      throw new Error(response.error?.message || 'Login failed');
    } catch (error) {
      console.error('Auth API login error:', error);
      const message = error instanceof Error ? error.message : 'Network error during login';
      throw new Error(message);
    }
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
          role: response.data.user.role,
          avatar: response.data.user.avatar,
          isVerified: response.data.user.isVerified
        };
        return user;
      }
    } catch (error) {
      // Don't log 401 errors as they're expected when user is not logged in
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('401') && !errorMessage.includes('Access denied')) {
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
        role: response.data.user.role,
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
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    if (!email || !password) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.login(email, password);
      setUser(user);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) {
      toast.error('No user found');
      return;
    }
    
    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(message);
      throw error;
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
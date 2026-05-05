import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from './api/client';
import type { AppUser, UserRole } from './types';

export type { UserRole };

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  register: (data: any) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await fetchApi('/auth/me');
          setUser(userData);
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const { user, token } = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', token);
      setUser(user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      const { user, token } = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      localStorage.setItem('token', token);
      setUser(user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, setAccessToken } from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshToken = localStorage.getItem('fb_refresh_token');
    if (refreshToken) {
      authApi
        .login('', '') // Won't work, but let's try refresh
        .catch(() => null)
        .finally(() => setLoading(false));

      // Actually, try to refresh directly
      fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('refresh failed');
        })
        .then((data) => {
          setAccessToken(data.accessToken);
          localStorage.setItem('fb_refresh_token', data.refreshToken);
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('fb_refresh_token');
          setAccessToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.accessToken);
    localStorage.setItem('fb_refresh_token', data.refreshToken);
    setUser(data.user);
  }, []);

  const loginDemo = useCallback(async () => {
    const data = await authApi.demo();
    setAccessToken(data.accessToken);
    localStorage.setItem('fb_refresh_token', data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('fb_refresh_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

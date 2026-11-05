// Estado global de autenticación y datos del usuario activo en TypeScript.
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, setTokenUpdateListener } from '../api/client';
import { User, AuthSession, UserRole } from '../types';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string, displayName: string, role?: UserRole) => Promise<User>;
  socialLogin: (provider: string, providerId: string, email: string, displayName?: string) => Promise<User>;
  updateProfile: (data: { username?: string; displayName?: string; avatarUrl?: string }) => Promise<any>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => ({} as User),
  register: async () => ({} as User),
  socialLogin: async () => ({} as User),
  updateProfile: async () => ({}),
  refreshUser: async () => {},
  logout: async () => {}
});

const sessionStorage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key)
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTokenUpdateListener((newToken: string | null) => {
      setToken(newToken);
      if (!newToken) setUser(null);
    });

    (async () => {
      try {
        const saved = await sessionStorage.get('metallica_session');
        if (saved) {
          const session: AuthSession = JSON.parse(saved);
          setUser(session.user);
          setToken(session.accessToken);
        }
      } catch (err) {
        console.warn('Error al restaurar sesión previa:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const session: AuthSession = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setUser(session.user);
    setToken(session.accessToken);
    await sessionStorage.set('metallica_session', JSON.stringify(session));
    return session.user;
  }

  async function register(
    username: string,
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'collector'
  ): Promise<User> {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: { username, email, password, displayName, role }
    });
    // Auto login after register
    return await login(email, password);
  }

  async function socialLogin(
    provider: string,
    providerId: string,
    email: string,
    displayName?: string
  ): Promise<User> {
    const session: AuthSession = await apiRequest('/auth/social-login', {
      method: 'POST',
      body: { provider, providerId, email, displayName }
    });
    setUser(session.user);
    setToken(session.accessToken);
    await sessionStorage.set('metallica_session', JSON.stringify(session));
    return session.user;
  }

  async function refreshUser(): Promise<void> {
    if (!token) return;
    try {
      const data = await apiRequest<{ user: User }>('/auth/me', { token });
      if (data.user) {
        setUser(data.user);
        const saved = await sessionStorage.get('metallica_session');
        if (saved) {
          const session: AuthSession = JSON.parse(saved);
          session.user = data.user;
          await sessionStorage.set('metallica_session', JSON.stringify(session));
        }
      }
    } catch (e) {
      console.warn('Error refreshing user:', e);
    }
  }

  async function updateProfile({
    username,
    displayName,
    avatarUrl
  }: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<any> {
    if (!token) return;
    const data = await apiRequest('/auth/profile', {
      method: 'PUT',
      token,
      body: { username, displayName, avatarUrl }
    });
    if (data.user) {
      setUser(data.user);
      const saved = await sessionStorage.get('metallica_session');
      if (saved) {
        const session: AuthSession = JSON.parse(saved);
        session.user = data.user;
        await sessionStorage.set('metallica_session', JSON.stringify(session));
      }
    }
    return data;
  }

  async function logout(): Promise<void> {
    setUser(null);
    setToken(null);
    await sessionStorage.remove('metallica_session');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        socialLogin,
        updateProfile,
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => useContext(AuthContext);

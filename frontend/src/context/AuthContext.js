import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

const sessionStorage = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key)
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await sessionStorage.get('metallica_session');
        if (saved) {
          const session = JSON.parse(saved);
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

  async function login(email, password) {
    const session = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setUser(session.user);
    setToken(session.accessToken);
    await sessionStorage.set('metallica_session', JSON.stringify(session));
    return session.user;
  }

  async function register(username, email, password, displayName, role = 'collector') {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: { username, email, password, displayName, role }
    });
    // Auto login after register
    return await login(email, password);
  }

  async function socialLogin(provider, providerId, email, displayName) {
    const session = await apiRequest('/auth/social-login', {
      method: 'POST',
      body: { provider, providerId, email, displayName }
    });
    setUser(session.user);
    setToken(session.accessToken);
    await sessionStorage.set('metallica_session', JSON.stringify(session));
    return session.user;
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const data = await apiRequest('/auth/me', { token });
      if (data.user) {
        setUser(data.user);
        const saved = await sessionStorage.get('metallica_session');
        if (saved) {
          const session = JSON.parse(saved);
          session.user = data.user;
          await sessionStorage.set('metallica_session', JSON.stringify(session));
        }
      }
    } catch (e) {
      console.warn('Error refreshing user:', e);
    }
  }

  async function logout() {
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
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

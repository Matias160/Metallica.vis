// Cliente HTTP centralizado con resolucin dinmica de host y renovacin automtica de token.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function getApiBaseUrl() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }
  // En mvil (Expo Go sobre Wi-Fi): conectar a la IP de la mquina de desarrollo
  return 'http://192.168.100.11:3000/api';
}

let tokenUpdateListener = null;
export function setTokenUpdateListener(cb) {
  tokenUpdateListener = cb;
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  let currentToken = options.token;

  if (!currentToken) {
    try {
      const saved = await AsyncStorage.getItem('metallica_session');
      if (saved) {
        const session = JSON.parse(saved);
        currentToken = session.accessToken;
      }
    } catch {}
  }

  const execute = async (tokenToUse) => {
    return await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {})
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  };

  let response = await execute(currentToken);
  let data = await response.json().catch(() => ({}));

  // Manejo transparente de token expirado (HTTP 401 / INVALID_TOKEN)
  if (response.status === 401 && (data.error?.code === 'INVALID_TOKEN' || data.error?.message?.includes('expir'))) {
    try {
      const saved = await AsyncStorage.getItem('metallica_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (session.refreshToken) {
          const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: session.refreshToken })
          });
          const refreshData = await refreshRes.json().catch(() => ({}));
          if (refreshRes.ok && refreshData.accessToken) {
            session.accessToken = refreshData.accessToken;
            await AsyncStorage.setItem('metallica_session', JSON.stringify(session));
            if (tokenUpdateListener) {
              tokenUpdateListener(refreshData.accessToken);
            }
            // Reintentar la llamada original con el token renovado
            response = await execute(refreshData.accessToken);
            data = await response.json().catch(() => ({}));
          } else {
            await AsyncStorage.removeItem('metallica_session');
            if (tokenUpdateListener) tokenUpdateListener(null);
          }
        }
      }
    } catch (refreshErr) {
      console.warn('[apiRequest] Error renovando sesin:', refreshErr);
    }
  }

  if (!response.ok) {
    throw new Error(data.error?.message || 'No se pudo completar la solicitud');
  }

  return data;
}

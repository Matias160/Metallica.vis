// Cliente HTTP centralizado con resolución dinámica de host y renovación automática de token.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  body?: any;
}

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:3000/api`;
    }
    return 'http://localhost:3000/api';
  }

  // 1. Detección dinámica de IP del servidor de desarrollo (Expo Go / Metro)
  const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const devHost = hostUri.split(':')[0];
    if (devHost) return `http://${devHost}:3000/api`;
  }

  // 2. IP actual de la máquina de desarrollo en la red Wi-Fi
  return 'http://10.0.2.106:3000/api';
}

type TokenListener = (token: string | null) => void;
let tokenUpdateListener: TokenListener | null = null;

export function setTokenUpdateListener(cb: TokenListener): void {
  tokenUpdateListener = cb;
}

export async function apiRequest<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
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

  const execute = async (tokenToUse?: string): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {})
        },
        ...options,
        signal: controller.signal,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  };

  let response: Response;
  try {
    response = await execute(currentToken);
  } catch (netErr: any) {
    // Si la conexión fue reseteada o falló, intentar una vez más tras 300ms
    try {
      await new Promise((r) => setTimeout(r, 300));
      response = await execute(currentToken);
    } catch (retryErr: any) {
      const isAbort = retryErr.name === 'AbortError' || netErr.name === 'AbortError';
      const errMsg = isAbort
        ? 'El servidor tardó demasiado en responder (tiempo de espera agotado).'
        : `No se pudo conectar al servidor en ${baseUrl}. Verificá que el backend esté ejecutándose en la misma red Wi-Fi.`;
      const err: any = new Error(errMsg);
      err.originalError = retryErr;
      throw err;
    }
  }

  let data: any = await response.json().catch(() => ({}));

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
          const refreshData: any = await refreshRes.json().catch(() => ({}));
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
      console.warn('[apiRequest] Error renovando sesión:', refreshErr);
    }
  }

  if (!response.ok) {
    throw new Error(data.error?.message || 'No se pudo completar la solicitud');
  }

  return data as T;
}

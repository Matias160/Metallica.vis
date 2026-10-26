import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || 'No se pudo completar la solicitud');
  return data;
}

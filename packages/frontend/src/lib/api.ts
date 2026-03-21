import type { AuthTokens, Fahrzeug, CreateFahrzeugInput, UpdateFahrzeugInput, OdometerReading } from '../types';

const BASE_URL = '/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Try refresh
    const refreshToken = localStorage.getItem('fb_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const data: AuthTokens = await refreshRes.json();
          accessToken = data.accessToken;
          localStorage.setItem('fb_refresh_token', data.refreshToken);

          // Retry original request
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          const retryRes = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
          });

          if (!retryRes.ok) {
            throw new Error(`HTTP ${retryRes.status}`);
          }
          return retryRes.json();
        }
      } catch {
        // Refresh failed
      }
    }

    localStorage.removeItem('fb_refresh_token');
    accessToken = null;
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    request<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  demo: () =>
    request<AuthTokens>('/auth/demo', { method: 'POST' }),
};

// Fahrzeuge
export const fahrzeuge = {
  list: () => request<Fahrzeug[]>('/fahrzeuge'),
  get: (id: string) => request<Fahrzeug>(`/fahrzeuge/${id}`),
  create: (data: CreateFahrzeugInput) =>
    request<Fahrzeug>('/fahrzeuge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateFahrzeugInput) =>
    request<Fahrzeug>(`/fahrzeuge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Odometer
export const odometer = {
  list: (fahrzeugId: string) =>
    request<OdometerReading[]>(`/odometer/${fahrzeugId}`),
  create: (data: { fahrzeugId: string; datum: string; kmStand: number }) =>
    request<OdometerReading>('/odometer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

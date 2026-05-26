import type { UserProfile } from '../types';
import { authHeaders, setAccessToken } from './authToken';

type AuthResponse = {
  ok: boolean;
  user?: UserProfile;
  accessToken?: string;
  error?: string;
};

export async function apiRegister(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  const res = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  const body = (await res.json()) as AuthResponse;
  if (body.ok && body.accessToken) setAccessToken(body.accessToken);
  return body;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json()) as AuthResponse;
  if (body.ok && body.accessToken) setAccessToken(body.accessToken);
  return body;
}

export async function apiFetchMe(): Promise<UserProfile | null> {
  const res = await fetch('/api/v1/auth/me', { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) return null;
  const body = (await res.json()) as { ok: boolean; user?: UserProfile };
  return body.ok && body.user ? body.user : null;
}

export function clearAuthToken(): void {
  setAccessToken(null);
}

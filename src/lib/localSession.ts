export const LOCAL_SESSION_KEY = 'homaire_local_session_v1';

export interface LocalSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isAdmin: boolean;
}

export function readLocalSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as LocalSession;
    if (!s?.uid || !s?.email) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeLocalSession(session: LocalSession): void {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
}

export function clearLocalSession(): void {
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

export function stableUidFromEmail(email: string): string {
  const norm = email.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < norm.length; i++) {
    h = (Math.imul(31, h) + norm.charCodeAt(i)) | 0;
  }
  return `local_${Math.abs(h).toString(36)}`;
}

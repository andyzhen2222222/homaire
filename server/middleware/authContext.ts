import type { IncomingMessage } from 'node:http';
import { getBearerToken, isAdminPasswordRequest } from '../http/apiUtils';
import { verifyToken } from '../services/authService';
import { getUserById } from '../services/authService';
import type { UserProfile } from '../../src/types';

export type AuthContext = {
  userId: string | null;
  profile: UserProfile | null;
  isAdmin: boolean;
};

export async function resolveAuthContext(req: IncomingMessage): Promise<AuthContext> {
  if (isAdminPasswordRequest(req)) {
    return { userId: null, profile: null, isAdmin: true };
  }
  const token = getBearerToken(req);
  if (!token) return { userId: null, profile: null, isAdmin: false };
  const payload = verifyToken(token);
  if (!payload) return { userId: null, profile: null, isAdmin: false };
  const profile = await getUserById(payload.sub);
  if (!profile) return { userId: null, profile: null, isAdmin: false };
  return {
    userId: profile.uid,
    profile,
    isAdmin: profile.isAdmin === true || payload.isAdmin === true,
  };
}

export function requireAuth(ctx: AuthContext): string {
  if (!ctx.userId) throw new Error('Unauthorized');
  return ctx.userId;
}

export function requireAdmin(ctx: AuthContext): void {
  if (!ctx.isAdmin) throw new Error('Forbidden');
}

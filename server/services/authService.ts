import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../db/client';
import { mapUserProfile } from '../mappers/catalogMappers';
import type { UserProfile } from '../../src/types';

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
}

function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

export type JwtPayload = { sub: string; isAdmin: boolean };

export function signToken(userId: string, isAdmin: boolean): string {
  const options: SignOptions = { expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, isAdmin }, getJwtSecret(), options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: UserProfile; accessToken: string }> {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) throw new Error('Email already registered');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      displayName: displayName.trim() || normalized.split('@')[0],
    },
  });
  return {
    user: mapUserProfile(user),
    accessToken: signToken(user.id, user.isAdmin),
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: UserProfile; accessToken: string }> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) throw new Error('Invalid email or password');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid email or password');
  return {
    user: mapUserProfile(user),
    accessToken: signToken(user.id, user.isAdmin),
  };
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? mapUserProfile(user) : null;
}

export async function updateUserProfile(
  userId: string,
  patch: { displayName?: string; photoUrl?: string; password?: string }
): Promise<UserProfile> {
  const data: Record<string, string> = {};
  if (patch.displayName !== undefined) data.displayName = patch.displayName;
  if (patch.photoUrl !== undefined) data.photoUrl = patch.photoUrl;
  if (patch.password) {
    data.passwordHash = await bcrypt.hash(patch.password, SALT_ROUNDS);
  }
  const user = await prisma.user.update({ where: { id: userId }, data });
  return mapUserProfile(user);
}

export async function seedAdminUser(): Promise<void> {
  const email = (process.env.ADMIN_SEED_EMAIL || 'admin@homaire.local').trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || process.env.STORE_ADMIN_PASSWORD || 'admin';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isAdmin) {
      await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
    }
    return;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Admin',
      isAdmin: true,
    },
  });
}

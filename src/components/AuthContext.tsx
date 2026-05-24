import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UserProfile } from '../types';
import {
  readLocalSession,
  writeLocalSession,
  clearLocalSession,
  stableUidFromEmail,
  type LocalSession,
} from '../lib/localSession';

/** 与原先 Firebase User 在界面中使用的字段对齐 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export type LoginWithCredentialsParams = {
  email: string;
  displayName?: string;
  /** 与 VITE_LOCAL_ADMIN_PASSWORD 一致（未配置时默认 admin）则为管理员 */
  adminPassword: string;
  /** 为 true 时：口令不正确则不写入会话，并返回错误（用于 /admin 登录） */
  requireMatchingAdminPassword?: boolean;
};

export type LoginWithCredentialsResult = { ok: true } | { ok: false; error: string };

function getExpectedAdminPassword(): string {
  const configured = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD;
  if (configured === undefined || configured === null || String(configured).length === 0) {
    return 'admin';
  }
  return String(configured);
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  /** 连续弹窗登录（页头「Login」等），仍可用 */
  login: () => Promise<void>;
  /** 表单登录；可选要求管理员口令必须正确 */
  loginWithCredentials: (params: LoginWithCredentialsParams) => Promise<LoginWithCredentialsResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sessionToAuthUser(s: LocalSession): AuthUser {
  return {
    uid: s.uid,
    email: s.email,
    displayName: s.displayName,
    photoURL: s.photoURL,
    emailVerified: true,
  };
}

function sessionToProfile(s: LocalSession): UserProfile {
  return {
    uid: s.uid,
    email: s.email,
    displayName: s.displayName,
    photoURL: s.photoURL || '',
    isAdmin: s.isAdmin,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = readLocalSession();
    if (s) {
      setUser(sessionToAuthUser(s));
      setProfile(sessionToProfile(s));
    }
    setLoading(false);
  }, []);

  const commitSession = useCallback((email: string, displayName: string, adminPassword: string) => {
    const expected = getExpectedAdminPassword();
    const isAdmin = adminPassword === expected;
    const session: LocalSession = {
      uid: stableUidFromEmail(email),
      email,
      displayName,
      photoURL: null,
      isAdmin,
    };
    writeLocalSession(session);
    setUser(sessionToAuthUser(session));
    setProfile(sessionToProfile(session));
  }, []);

  const loginWithCredentials = useCallback(
    async (params: LoginWithCredentialsParams): Promise<LoginWithCredentialsResult> => {
      const email = (params.email || '').trim() || 'demo@local.test';
      const displayName =
        (params.displayName?.trim() || email.split('@')[0] || 'User').trim() || 'User';
      const pwd = params.adminPassword ?? '';
      const expected = getExpectedAdminPassword();
      const matches = pwd === expected;

      if (params.requireMatchingAdminPassword && !matches) {
        return {
          ok: false,
          error:
            'Incorrect admin password. If VITE_LOCAL_ADMIN_PASSWORD is not set in .env, use the default password admin; otherwise use the value from your .env file.',
        };
      }

      commitSession(email, displayName, pwd);
      return { ok: true };
    },
    [commitSession]
  );

  const login = useCallback(async () => {
    const emailInput = window.prompt('Sign-in email (stored in this browser)', 'demo@local.test');
    if (emailInput === null) return;
    const email = emailInput.trim() || 'demo@local.test';
    const nameInput = window.prompt('Display name (optional)', email.split('@')[0] || 'User');
    if (nameInput === null) return;
    const displayName = nameInput.trim() || email.split('@')[0] || 'User';
    const pwdInput = window.prompt('Admin password (leave empty for shopper only; default admin)', '');
    if (pwdInput === null) return;
    commitSession(email, displayName, pwdInput);
  }, [commitSession]);

  const logout = useCallback(async () => {
    clearLocalSession();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

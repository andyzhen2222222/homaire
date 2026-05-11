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

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
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

  const login = useCallback(async () => {
    const emailInput = window.prompt('登录邮箱（数据保存在本机浏览器）', 'demo@local.test');
    if (emailInput === null) return;
    const email = emailInput.trim() || 'demo@local.test';
    const nameInput = window.prompt('显示名称（可留空则用邮箱前缀）', email.split('@')[0] || 'User');
    if (nameInput === null) return;
    const displayName = nameInput.trim() || email.split('@')[0] || 'User';
    const pwdInput = window.prompt('管理员口令（留空=仅顾客；默认 admin）', '');
    if (pwdInput === null) return;
    const configured = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD;
    const expected =
      configured === undefined || configured === null || String(configured).length === 0
        ? 'admin'
        : String(configured);
    const isAdmin = pwdInput === expected;
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

  const logout = useCallback(async () => {
    clearLocalSession();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

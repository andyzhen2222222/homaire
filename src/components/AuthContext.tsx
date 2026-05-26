import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UserProfile } from '../types';
import {
  readLocalSession,
  writeLocalSession,
  clearLocalSession,
  type LocalSession,
} from '../lib/localSession';
import { apiFetchMe, apiLogin, apiRegister, clearAuthToken } from '../lib/authApi';
import { isRemoteStoreEnabled } from '../lib/storeConfig';

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
  adminPassword: string;
  requireMatchingAdminPassword?: boolean;
};

export type LoginWithCredentialsResult = { ok: true } | { ok: false; error: string };

export type RegisterParams = {
  email: string;
  password: string;
  displayName: string;
};

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  loginWithCredentials: (params: LoginWithCredentialsParams) => Promise<LoginWithCredentialsResult>;
  register: (params: RegisterParams) => Promise<LoginWithCredentialsResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToAuthUser(p: UserProfile): AuthUser {
  return {
    uid: p.uid,
    email: p.email,
    displayName: p.displayName,
    photoURL: p.photoURL || null,
    emailVerified: true,
  };
}

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

function applyProfile(setUser: (u: AuthUser | null) => void, setProfile: (p: UserProfile | null) => void, p: UserProfile) {
  setUser(profileToAuthUser(p));
  setProfile(p);
  writeLocalSession({
    uid: p.uid,
    email: p.email,
    displayName: p.displayName,
    photoURL: p.photoURL || null,
    isAdmin: p.isAdmin,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const boot = async () => {
      if (isRemoteStoreEnabled()) {
        const me = await apiFetchMe();
        if (me) {
          applyProfile(setUser, setProfile, me);
          setLoading(false);
          return;
        }
      }
      const s = readLocalSession();
      if (s) {
        setUser(sessionToAuthUser(s));
        setProfile(sessionToProfile(s));
      }
      setLoading(false);
    };
    void boot();
  }, []);

  const loginWithCredentials = useCallback(
    async (params: LoginWithCredentialsParams): Promise<LoginWithCredentialsResult> => {
      const email = (params.email || '').trim();
      const password = params.adminPassword ?? '';
      if (!email || !password) {
        return { ok: false, error: '请输入邮箱和密码' };
      }

      if (isRemoteStoreEnabled()) {
        const result = await apiLogin(email, password);
        if (!result.ok || !result.user) {
          return { ok: false, error: result.error || '登录失败' };
        }
        if (params.requireMatchingAdminPassword && !result.user.isAdmin) {
          clearAuthToken();
          return { ok: false, error: '该账号不是管理员' };
        }
        applyProfile(setUser, setProfile, result.user);
        setAuthModalOpen(false);
        return { ok: true };
      }

      const displayName =
        (params.displayName?.trim() || email.split('@')[0] || 'User').trim() || 'User';
      const session: LocalSession = {
        uid: `local_${email}`,
        email,
        displayName,
        photoURL: null,
        isAdmin: params.requireMatchingAdminPassword ? true : false,
      };
      writeLocalSession(session);
      setUser(sessionToAuthUser(session));
      setProfile(sessionToProfile(session));
      setAuthModalOpen(false);
      return { ok: true };
    },
    []
  );

  const register = useCallback(async (params: RegisterParams): Promise<LoginWithCredentialsResult> => {
    if (isRemoteStoreEnabled()) {
      const result = await apiRegister(params.email, params.password, params.displayName);
      if (!result.ok || !result.user) {
        return { ok: false, error: result.error || '注册失败' };
      }
      applyProfile(setUser, setProfile, result.user);
      setAuthModalOpen(false);
      return { ok: true };
    }
    return loginWithCredentials({
      email: params.email,
      displayName: params.displayName,
      adminPassword: params.password,
    });
  }, [loginWithCredentials]);

  const logout = useCallback(async () => {
    clearAuthToken();
    clearLocalSession();
    setUser(null);
    setProfile(null);
  }, []);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);
  const login = openAuthModal;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        loginWithCredentials,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

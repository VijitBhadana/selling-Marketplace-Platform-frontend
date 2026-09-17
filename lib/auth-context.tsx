'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from './api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
};

export type AuthIntent = 'default' | 'post-ad' | 'purchase';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authIntent: AuthIntent;
  login: (email: string, password: string) => Promise<boolean>;
  /** Stores an already-issued token/user (e.g. right after OTP verification) without re-authenticating. */
  setSession: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
  /** Runs `action` immediately if logged in; otherwise opens the login modal and
   *  runs `action` right after a successful login. Returns whether it ran now. */
  requireAuth: (action?: () => void, intent?: AuthIntent) => boolean;
  openAuthModal: (intent?: AuthIntent) => void;
  hideAuthModal: () => void;
  cancelAuthModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>('default');
  const pendingActionRef = useRef<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // A saved session ends once the admin suspends (or removes) the account.
        api.users.me(storedToken).catch((err) => {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        });
      }
    } catch {
      // ignore malformed storage
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
    setIsAuthModalOpen(false);

    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    // The admin always lands in the admin panel, whatever they were doing.
    if (res.user.role === 'ADMIN') {
      router.push('/admin');
      return true;
    }
    if (pending) {
      pending();
      return true;
    }
    return false;
  }, [router]);

  const setSession = useCallback((accessToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(accessToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const openAuthModal = useCallback((intent: AuthIntent = 'default') => {
    setAuthIntent(intent);
    setIsAuthModalOpen(true);
  }, []);

  // Hide without cancelling the pending action — used when navigating to /register.
  const hideAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Fully cancel — used on backdrop click / close button.
  const cancelAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingActionRef.current = null;
  }, []);

  const requireAuth = useCallback(
    (action?: () => void, intent: AuthIntent = 'default') => {
      if (user) {
        action?.();
        return true;
      }
      pendingActionRef.current = action ?? null;
      setAuthIntent(intent);
      setIsAuthModalOpen(true);
      return false;
    },
    [user],
  );

  // Memoized so consumers only re-render when auth state actually changes,
  // instead of on every AuthProvider render (this wraps the whole app).
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthModalOpen,
      authIntent,
      login,
      setSession,
      logout,
      requireAuth,
      openAuthModal,
      hideAuthModal,
      cancelAuthModal,
    }),
    [user, token, loading, isAuthModalOpen, authIntent, login, setSession, logout, requireAuth, openAuthModal, hideAuthModal, cancelAuthModal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setUnauthorizedHandler } from '../api/api-client';
import type { AuthContextValue } from './auth.types';
import { clearStoredToken, getStoredToken, setStoredToken } from './auth-storage';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ accessToken, isInitializing }, setAuthState] = useState(() => ({
    accessToken: getStoredToken(),
    isInitializing: false,
  }));

  const logout = useCallback(() => {
    clearStoredToken();
    setAuthState((current) => ({ ...current, accessToken: null }));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthState((current) => ({ ...current, accessToken: null }));
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback((token: string) => {
    setStoredToken(token);
    setAuthState((current) => ({ ...current, accessToken: token }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isInitializing,
      login,
      logout,
    }),
    [accessToken, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

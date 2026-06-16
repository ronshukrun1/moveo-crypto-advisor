import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '../api/api-error';
import { getCurrentUser, loginUser, type LoginInput } from '../api/auth';
import { setUnauthorizedHandler } from '../api/api-client';
import type { User } from '../types/user';
import type { AuthContextValue } from './auth.types';
import { clearStoredToken, getStoredToken, setStoredToken } from './auth-storage';

const AuthContext = createContext<AuthContextValue | null>(null);

interface InternalAuthState {
  user: User | null;
  accessToken: string | null;
  isInitializing: boolean;
  initError: boolean;
  sessionExpired: boolean;
}

function createInitialState(): InternalAuthState {
  const accessToken = getStoredToken();

  return {
    user: null,
    accessToken,
    isInitializing: Boolean(accessToken),
    initError: false,
    sessionExpired: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalAuthState>(createInitialState);

  const clearAuthState = useCallback((sessionExpired = false) => {
    clearStoredToken();
    setState({
      user: null,
      accessToken: null,
      isInitializing: false,
      initError: false,
      sessionExpired,
    });
  }, []);

  const loadCurrentUser = useCallback(async (token: string): Promise<User> => {
    setStoredToken(token);
    const user = await getCurrentUser();
    setState((current) => ({
      ...current,
      accessToken: token,
      user,
      isInitializing: false,
      initError: false,
      sessionExpired: false,
    }));
    return user;
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getStoredToken();

    if (!token) {
      clearAuthState();
      return null;
    }

    try {
      return await loadCurrentUser(token);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearAuthState(true);
        return null;
      }

      setState((current) => ({
        ...current,
        initError: true,
        isInitializing: false,
      }));
      throw error;
    }
  }, [clearAuthState, loadCurrentUser]);

  const retryInitialization = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setState((current) => ({ ...current, isInitializing: false, initError: false }));
      return;
    }

    setState((current) => ({ ...current, isInitializing: true, initError: false }));

    try {
      await loadCurrentUser(token);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearAuthState(true);
        return;
      }

      setState((current) => ({
        ...current,
        isInitializing: false,
        initError: true,
      }));
    }
  }, [clearAuthState, loadCurrentUser]);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      return;
    }

    void (async () => {
      try {
        await loadCurrentUser(token);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          clearAuthState(true);
          return;
        }

        setState((current) => ({
          ...current,
          isInitializing: false,
          initError: true,
        }));
      }
    })();
  }, [clearAuthState, loadCurrentUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthState(true);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearAuthState]);

  const login = useCallback(
    async (credentials: LoginInput): Promise<User> => {
      const response = await loginUser(credentials);
      return loadCurrentUser(response.accessToken);
    },
    [loadCurrentUser],
  );

  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  const acknowledgeSessionExpired = useCallback(() => {
    setState((current) => ({ ...current, sessionExpired: false }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      accessToken: state.accessToken,
      isAuthenticated: Boolean(state.accessToken && state.user),
      isInitializing: state.isInitializing,
      initError: state.initError,
      sessionExpired: state.sessionExpired,
      login,
      logout,
      refreshUser,
      acknowledgeSessionExpired,
      retryInitialization,
    }),
    [state, login, logout, refreshUser, acknowledgeSessionExpired, retryInitialization],
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

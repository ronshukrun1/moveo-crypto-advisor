import type { LoginInput } from '../api/auth';
import type { User } from '../types/user';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  initError: boolean;
  sessionExpired: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginInput) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  acknowledgeSessionExpired: () => void;
  retryInitialization: () => Promise<void>;
}

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}

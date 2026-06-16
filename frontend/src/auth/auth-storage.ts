const ACCESS_TOKEN_KEY = 'accessToken';

export function getStoredToken(): string | null {
  try {
    const value = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!value || value.trim().length === 0) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

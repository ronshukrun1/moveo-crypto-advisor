export interface AppEnvironment {
  apiBaseUrl: string;
}

function validateApiBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      'VITE_API_BASE_URL is required. Copy frontend/.env.example to frontend/.env and set a valid backend API URL.',
    );
  }

  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('VITE_API_BASE_URL must use http or https.');
    }

    return trimmed.replace(/\/$/, '');
  } catch {
    throw new Error(
      `VITE_API_BASE_URL must be a valid URL. Received: "${trimmed}"`,
    );
  }
}

export function getEnvironment(): AppEnvironment {
  return {
    apiBaseUrl: validateApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  };
}

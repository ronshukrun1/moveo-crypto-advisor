import axios from 'axios';
import { getEnvironment } from '../config/environment';
import { clearStoredToken, getStoredToken } from '../auth/auth-storage';
import { normalizeApiError } from './api-error';

const { apiBaseUrl } = getEnvironment();

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      unauthorizedHandler?.();
    }

    return Promise.reject(normalizeApiError(error));
  },
);

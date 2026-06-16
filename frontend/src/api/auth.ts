import { apiClient } from './api-client';
import { endpoints } from './endpoints';
import type { User } from '../types/user';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(endpoints.auth.register, {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  return response.data;
}

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(endpoints.auth.login, {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>(endpoints.auth.me);
  return response.data;
}

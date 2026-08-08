import { apiClient } from './client';
import type { AuthTokenResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authApi = {
  login(request: LoginRequest): Promise<AuthTokenResponse> {
    return apiClient.post<AuthTokenResponse>('/api/auth/login', request);
  },

  register(request: RegisterRequest): Promise<User> {
    return apiClient.post<User>('/api/users/register', request);
  },

  getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/users/me');
  },
};

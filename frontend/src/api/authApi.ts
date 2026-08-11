import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  User,
  VerifyEmailRequest,
} from '../types';

export const authApi = {
  login(request: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/login', request);
  },

  register(request: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/api/users/register', request);
  },

  verifyEmail(request: VerifyEmailRequest): Promise<User> {
    return apiClient.post<User>('/api/auth/verify-email', request);
  },

  resendVerification(email: string): Promise<ResendVerificationResponse> {
    return apiClient.post<ResendVerificationResponse>('/api/auth/resend-verification', { email });
  },

  forgotPassword(email: string): Promise<{ email: string; message: string; devResetCode?: string }> {
    return apiClient.post<{ email: string; message: string; devResetCode?: string }>('/api/auth/forgot-password', { email });
  },

  resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/reset-password', { email, code, newPassword });
  },

  getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/api/users/me');
  },
};


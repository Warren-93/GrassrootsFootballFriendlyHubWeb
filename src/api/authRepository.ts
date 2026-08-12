import { apiClient } from './client';
import { tokenStore } from '../auth/tokenStore';
import type { LoginRequest, RegisterRequest, TokenResponse, UserView, VerificationResendResponse } from './types';

async function storeAndReturn(result: Awaited<ReturnType<typeof apiClient.post<TokenResponse>>>) {
  if (result.ok) tokenStore.set(result.value.accessToken, result.value.refreshToken);
  return result;
}

export const authRepository = {
  register: (request: RegisterRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/register', request, false).then(storeAndReturn),

  login: (request: LoginRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/login', request, false).then(storeAndReturn),

  me: () => apiClient.get<UserView>('/api/v1/me'),

  requestPasswordReset: (email: string) =>
    apiClient.post<void>('/api/v1/auth/password-reset', { email }, false),

  confirmPasswordReset: (token: string, newPassword: string) =>
    apiClient.post<void>('/api/v1/auth/password-reset/confirm', { token, newPassword }, false),

  resendVerification: () => apiClient.post<VerificationResendResponse>('/api/v1/auth/verify/resend'),

  confirmVerification: (token: string) =>
    apiClient.post<void>('/api/v1/auth/verify/confirm', { token }, false),

  signOut: () => tokenStore.clear(),

  isSignedIn: () => tokenStore.accessToken() !== null,
};

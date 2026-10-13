import { apiClient, AUTH_MODE_HEADER, tryRefresh } from './client';
import { tokenStore } from '../auth/tokenStore';
import type {
  ChangeEmailRequest,
  ChangeEmailResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserView,
  VerificationResendResponse,
} from './types';

async function storeAndReturn(result: Awaited<ReturnType<typeof apiClient.post<TokenResponse>>>) {
  if (result.ok) tokenStore.set(result.value.accessToken);
  return result;
}

export const authRepository = {
  register: (request: RegisterRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/register', request, false, AUTH_MODE_HEADER).then(storeAndReturn),

  login: (request: LoginRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/login', request, false, AUTH_MODE_HEADER).then(storeAndReturn),

  me: () => apiClient.get<UserView>('/api/v1/me'),

  requestPasswordReset: (email: string) =>
    apiClient.post<void>('/api/v1/auth/password-reset', { email }, false),

  confirmPasswordReset: (token: string, newPassword: string) =>
    apiClient.post<void>('/api/v1/auth/password-reset/confirm', { token, newPassword }, false),

  resendVerification: () => apiClient.post<VerificationResendResponse>('/api/v1/auth/verify/resend'),

  confirmVerification: (token: string) =>
    apiClient.post<void>('/api/v1/auth/verify/confirm', { token }, false),

  changePassword: (request: ChangePasswordRequest) => apiClient.post<void>('/api/v1/me/password', request),

  changeEmail: (request: ChangeEmailRequest) =>
    apiClient.post<ChangeEmailResponse>('/api/v1/me/email', request),

  /** Revokes the session server-side and clears the refresh cookie; local state is cleared even if that call fails. */
  signOut: async () => {
    tokenStore.clear();
    await apiClient.post<void>('/api/v1/auth/logout', undefined, false, AUTH_MODE_HEADER);
  },

  /** True once there is an access token, refreshing from the cookie first if needed (e.g. after a reload). */
  restoreSession: async () => tokenStore.accessToken() !== null || tryRefresh(),
};

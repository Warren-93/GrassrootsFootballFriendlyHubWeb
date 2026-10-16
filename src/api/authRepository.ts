import { apiClient, tryRefresh } from './client';
import { tokenStore } from '../auth/tokenStore';
import type {
  ChangeEmailRequest,
  ChangeEmailResponse,
  ChangePasswordRequest,
  LoginRequest,
  OAuthProvider,
  OAuthSignInRequest,
  RegisterRequest,
  TokenResponse,
  UserView,
  VerificationResendResponse,
} from './types';

async function storeAndReturn(result: Awaited<ReturnType<typeof apiClient.post<TokenResponse>>>) {
  if (result.ok) tokenStore.set(result.value.accessToken, result.value.refreshToken);
  return result;
}

export const authRepository = {
  register: (request: RegisterRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/register', request, false).then(storeAndReturn),

  login: (request: LoginRequest) =>
    apiClient.post<TokenResponse>('/api/v1/auth/login', request, false).then(storeAndReturn),

  /** "Continue with Google/Apple": same token response and refresh cookie as login, plus newUser for a new account. */
  oauthSignIn: (provider: OAuthProvider, request: OAuthSignInRequest) =>
    apiClient.post<TokenResponse>(`/api/v1/auth/oauth/${provider}`, request, false).then(storeAndReturn),

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

  /** Revokes the refresh token server-side and clears the cookie, then forgets the access token. */
  signOut: async () => {
    const refreshToken = tokenStore.refreshToken();
    tokenStore.clear();
    await apiClient.post<void>('/api/v1/auth/logout', refreshToken ? { refreshToken } : {}, false);
  },

  /** After a reload only the refresh cookie survives, so trade it for an access token. */
  restoreSession: async (): Promise<boolean> =>
    tokenStore.accessToken() !== null || (await tryRefresh()),
};

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOAuthSignIn } from './useOAuthSignIn';
import { useAuth } from './AuthContext';
import { tokenStore } from './tokenStore';
import { apiClient } from '../api/client';
import { takePostAuthRedirect } from '../routes/postAuthRedirect';
import type { OAuthProvider, OAuthSignInRequest, TokenResponse } from '../api/types';

vi.mock('../api/client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
  tryRefresh: vi.fn(),
}));
vi.mock('./AuthContext', () => ({ useAuth: vi.fn() }));

const mockedPost = vi.mocked(apiClient.post);
const mockedGet = vi.mocked(apiClient.get);
const resolveSession = vi.fn();
const onError = vi.fn();

function tokenResponse(newUser?: boolean): TokenResponse {
  return {
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 'u1', email: 'coach@example.com', displayName: 'Sam Coach', emailVerified: true },
    verificationToken: null,
    newUser,
  };
}

function Harness({ provider, request }: { provider: OAuthProvider; request: OAuthSignInRequest }) {
  const { signIn, pending } = useOAuthSignIn(onError);
  return (
    <button onClick={() => void signIn(provider, request)} disabled={pending}>
      Continue
    </button>
  );
}

function renderHarness(provider: OAuthProvider, request: OAuthSignInRequest) {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<Harness provider={provider} request={request} />} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/role-selection" element={<div>Role selection</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('useOAuthSignIn', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedGet.mockReset();
    mockedGet.mockResolvedValue({ ok: true, value: [] });
    resolveSession.mockReset();
    onError.mockReset();
    tokenStore.clear();
    takePostAuthRedirect();
    vi.mocked(useAuth).mockReturnValue({ resolveSession } as unknown as ReturnType<typeof useAuth>);
  });

  it('signs an existing user in with their Google ID token and goes to the dashboard', async () => {
    mockedPost.mockResolvedValue({ ok: true, value: tokenResponse(false) });
    renderHarness('google', { idToken: 'google-id-token' });

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledWith('/api/v1/auth/oauth/google', { idToken: 'google-id-token' }, false);
    expect(tokenStore.accessToken()).toBe('access-token');
    expect(resolveSession).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(null);
    expect(onError).not.toHaveBeenCalledWith(expect.any(String));
  });

  it('sends a brand-new Apple account to onboarding, with the name Apple gave', async () => {
    mockedPost.mockResolvedValue({ ok: true, value: tokenResponse(true) });
    renderHarness('apple', { idToken: 'apple-id-token', displayName: 'Sam Coach' });

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Role selection')).toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/v1/auth/oauth/apple',
      { idToken: 'apple-id-token', displayName: 'Sam Coach' },
      false,
    );
    // PublicOnlyRoute takes over as soon as the session resolves, so it must point at onboarding too.
    expect(takePostAuthRedirect()).toBe('/role-selection');
  });

  it('sends a new account that an invitation already put on a team to the dashboard', async () => {
    mockedPost.mockResolvedValue({ ok: true, value: tokenResponse(true) });
    mockedGet.mockResolvedValue({ ok: true, value: [{ id: 'team-1', name: 'Riverside U12 Girls' }] });
    renderHarness('google', { idToken: 'google-id-token' });

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/teams/mine');
    expect(takePostAuthRedirect()).toBe('/');
  });

  it("passes the API's error to the page and stays signed out", async () => {
    mockedPost.mockResolvedValue({
      ok: false,
      message: "We couldn't verify that Google sign-in. Please try again.",
      status: 401,
    });
    renderHarness('google', { idToken: 'expired-token' });

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() =>
      expect(onError).toHaveBeenLastCalledWith("We couldn't verify that Google sign-in. Please try again."),
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(resolveSession).not.toHaveBeenCalled();
    expect(tokenStore.accessToken()).toBeNull();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

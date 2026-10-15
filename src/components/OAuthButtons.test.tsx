import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthButtons } from './OAuthButtons';
import { authRepository } from '../api/authRepository';
import type { ClientConfig, TokenResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { AppleSignInFailure, listenForGoogleIdToken, loadApple, prepareGoogle, signInWithApple } from '../auth/oauthSdk';
import { useClientConfigStore } from '../session/ClientConfigState';

vi.mock('../api/authRepository', () => ({ authRepository: { oauthSignIn: vi.fn() } }));
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../auth/oauthSdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../auth/oauthSdk')>()),
  prepareGoogle: vi.fn(),
  listenForGoogleIdToken: vi.fn(),
  loadApple: vi.fn(),
  signInWithApple: vi.fn(),
}));

const onError = vi.fn();
const renderButton = vi.fn();

function config(google: ClientConfig['google'], apple: ClientConfig['apple']): ClientConfig {
  return { supportEmail: null, google, apple };
}

const GOOGLE_OFF = { enabled: false, clientId: null };
const GOOGLE_ON = { enabled: true, clientId: 'abc.apps.googleusercontent.com' };
const APPLE_OFF = { enabled: false, servicesId: null };
const APPLE_ON = { enabled: true, servicesId: 'com.kickabout.web' };

function renderButtons(clientConfig: ClientConfig) {
  useClientConfigStore.setState({ config: clientConfig, status: 'loaded' });
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<OAuthButtons onError={onError} />} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/role-selection" element={<div>Role selection</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ resolveSession: vi.fn() } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(prepareGoogle).mockResolvedValue({ accounts: { id: { initialize: vi.fn(), renderButton } } });
    vi.mocked(listenForGoogleIdToken).mockReturnValue(() => {});
    vi.mocked(loadApple).mockResolvedValue({ auth: { init: vi.fn(), signIn: vi.fn() } });
  });

  it('shows nothing, and loads neither SDK, when both providers are off', () => {
    renderButtons(config(GOOGLE_OFF, APPLE_OFF));

    expect(screen.queryByText('or')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-sign-in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
    expect(prepareGoogle).not.toHaveBeenCalled();
    expect(loadApple).not.toHaveBeenCalled();
  });

  it('shows nothing while the config is still loading', () => {
    useClientConfigStore.setState({ config: null, status: 'loading' });
    render(
      <MemoryRouter>
        <OAuthButtons onError={onError} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('or')).not.toBeInTheDocument();
  });

  it("draws Google's button with the configured client ID", async () => {
    renderButtons(config(GOOGLE_ON, APPLE_OFF));

    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument();
    await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(1));
    expect(prepareGoogle).toHaveBeenCalledWith('abc.apps.googleusercontent.com');
    expect(renderButton.mock.calls[0][1]).toMatchObject({ text: 'continue_with', size: 'large' });
  });

  it('hides Apple when it has no web Services ID, even though it is on for the app', () => {
    renderButtons(config(GOOGLE_ON, { enabled: true, servicesId: null }));

    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
    expect(loadApple).not.toHaveBeenCalled();
  });

  it('shows Apple alone when Google is off', () => {
    renderButtons(config(GOOGLE_OFF, APPLE_ON));

    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
    expect(screen.queryByTestId('google-sign-in')).not.toBeInTheDocument();
    expect(prepareGoogle).not.toHaveBeenCalled();
  });

  it("signs in with Apple's token and name, then sends a new account to onboarding", async () => {
    vi.mocked(signInWithApple).mockResolvedValue({ idToken: 'apple-id-token', displayName: 'Sam Coach' });
    vi.mocked(authRepository.oauthSignIn).mockResolvedValue({
      ok: true,
      value: { accessToken: 'a', newUser: true } as TokenResponse,
    });
    renderButtons(config(GOOGLE_OFF, APPLE_ON));

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }));

    expect(await screen.findByText('Role selection')).toBeInTheDocument();
    expect(signInWithApple).toHaveBeenCalledWith('com.kickabout.web');
    expect(authRepository.oauthSignIn).toHaveBeenCalledWith('apple', {
      idToken: 'apple-id-token',
      displayName: 'Sam Coach',
    });
  });

  it("passes on an Apple failure, and stays quiet when the person closes Apple's window", async () => {
    vi.mocked(signInWithApple).mockRejectedValueOnce(
      new AppleSignInFailure("Apple sign-in didn't work - please try again."),
    );
    renderButtons(config(GOOGLE_OFF, APPLE_ON));
    const apple = screen.getByRole('button', { name: 'Continue with Apple' });

    await userEvent.click(apple);
    expect(onError).toHaveBeenLastCalledWith("Apple sign-in didn't work - please try again.");

    vi.mocked(signInWithApple).mockResolvedValueOnce(null);
    await userEvent.click(apple);
    expect(onError).toHaveBeenLastCalledWith(null);
    expect(authRepository.oauthSignIn).not.toHaveBeenCalled();
  });
});

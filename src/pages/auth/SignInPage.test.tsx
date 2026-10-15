import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignInPage } from './SignInPage';
import { authRepository } from '../../api/authRepository';
import type { ClientConfig, TokenResponse } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { listenForGoogleIdToken, loadApple, prepareGoogle } from '../../auth/oauthSdk';
import { useClientConfigStore } from '../../session/ClientConfigState';

vi.mock('../../api/authRepository', () => ({ authRepository: { login: vi.fn(), oauthSignIn: vi.fn() } }));
vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../auth/oauthSdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../auth/oauthSdk')>()),
  prepareGoogle: vi.fn(),
  listenForGoogleIdToken: vi.fn(),
  loadApple: vi.fn(),
}));

const resolveSession = vi.fn();

// Stands in for Google's SDK: its button hands a fixed ID token to whoever is listening.
let googleListener: ((idToken: string) => void) | null = null;
function fakeGoogleButton(parent: HTMLElement) {
  const button = document.createElement('button');
  button.textContent = 'Continue with Google';
  button.onclick = () => googleListener?.('google-id-token');
  parent.appendChild(button);
}

function renderSignIn(config: ClientConfig) {
  useClientConfigStore.setState({ config, status: 'loaded' });
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const bothOn: ClientConfig = {
  supportEmail: null,
  google: { enabled: true, clientId: 'abc.apps.googleusercontent.com' },
  apple: { enabled: true, servicesId: 'com.kickabout.web' },
};

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    googleListener = null;
    vi.mocked(useAuth).mockReturnValue({ resolveSession } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(prepareGoogle).mockResolvedValue({
      accounts: { id: { initialize: vi.fn(), renderButton: fakeGoogleButton } },
    });
    vi.mocked(listenForGoogleIdToken).mockImplementation((listener) => {
      googleListener = listener;
      return () => {
        googleListener = null;
      };
    });
    vi.mocked(loadApple).mockResolvedValue({ auth: { init: vi.fn(), signIn: vi.fn() } });
  });

  it('offers Google and Apple when the API has them switched on', async () => {
    renderSignIn(bothOn);

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
  });

  it('hides both when the API has them switched off', () => {
    renderSignIn({
      supportEmail: null,
      google: { enabled: false, clientId: null },
      apple: { enabled: false, servicesId: null },
    });

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByTestId('google-sign-in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
  });

  it("shows the API's error in the page's alert when Google sign-in is rejected", async () => {
    vi.mocked(authRepository.oauthSignIn).mockResolvedValue({
      ok: false,
      message: "We couldn't verify that sign-in. Please try again.",
      status: 401,
    });
    renderSignIn(bothOn);

    await userEvent.click(await screen.findByRole('button', { name: 'Continue with Google' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't verify that sign-in. Please try again.");
    expect(authRepository.oauthSignIn).toHaveBeenCalledWith('google', { idToken: 'google-id-token' });
    expect(resolveSession).not.toHaveBeenCalled();
  });

  it('goes to the dashboard after signing an existing account in with Google', async () => {
    vi.mocked(authRepository.oauthSignIn).mockResolvedValue({
      ok: true,
      value: { accessToken: 'a', newUser: false } as TokenResponse,
    });
    renderSignIn(bothOn);

    await userEvent.click(await screen.findByRole('button', { name: 'Continue with Google' }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(resolveSession).toHaveBeenCalledTimes(1);
  });
});

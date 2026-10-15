import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { WelcomePage } from './WelcomePage';
import type { ClientConfig } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useClientConfigStore } from '../../session/ClientConfigState';

vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mocked(useAuth).mockReturnValue({ resolveSession: vi.fn() } as unknown as ReturnType<typeof useAuth>);
vi.mock('../../auth/oauthSdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../auth/oauthSdk')>()),
  prepareGoogle: vi.fn(() => new Promise(() => {})),
  loadApple: vi.fn(() => new Promise(() => {})),
}));

function renderWelcome(config: ClientConfig) {
  useClientConfigStore.setState({ config, status: 'loaded' });
  return render(
    <MemoryRouter initialEntries={['/welcome']}>
      <WelcomePage />
    </MemoryRouter>,
  );
}

describe('WelcomePage', () => {
  it('shows only the email buttons when Google and Apple are off', () => {
    renderWelcome({
      supportEmail: null,
      google: { enabled: false, clientId: null },
      apple: { enabled: false, servicesId: null },
    });

    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByTestId('google-sign-in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
  });

  it('adds Continue with Google and Apple when they are on', () => {
    renderWelcome({
      supportEmail: null,
      google: { enabled: true, clientId: 'abc.apps.googleusercontent.com' },
      apple: { enabled: true, servicesId: 'com.kickabout.web' },
    });

    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
  });
});

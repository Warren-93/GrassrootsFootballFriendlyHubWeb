import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { authRepository } from '../../api/authRepository';
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

const providersOff: ClientConfig = {
  supportEmail: null,
  google: { enabled: false, clientId: null },
  apple: { enabled: false, servicesId: null },
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/role-selection" element={<p>Set up your team</p>} />
        <Route path="/email-verification" element={<p>Verify your email</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    useClientConfigStore.setState({ config: providersOff, status: 'loaded' });
  });

  it('fills in the email from an invitation link', () => {
    renderAt('/register?email=new.coach%40example.com');

    expect(screen.getByLabelText('Email')).toHaveValue('new.coach@example.com');
  });

  it('starts with an empty email otherwise', () => {
    renderAt('/register');

    expect(screen.getByLabelText('Email')).toHaveValue('');
  });

  it('offers Google and Apple only when the API has them switched on', () => {
    const { unmount } = renderAt('/register');
    expect(screen.queryByTestId('google-sign-in')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
    unmount();

    useClientConfigStore.setState({
      config: {
        ...providersOff,
        google: { enabled: true, clientId: 'abc.apps.googleusercontent.com' },
        apple: { enabled: true, servicesId: 'com.kickabout.web' },
      },
    });
    renderAt('/register');

    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
  });

  async function register(path: string) {
    vi.spyOn(authRepository, 'register').mockResolvedValue({ ok: true, value: undefined } as never);
    renderAt(path);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Display name'), 'Casey');
    if (path === '/register') await user.type(screen.getByLabelText('Email'), 'casey@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
  }

  it('sends a new account on to set up a team', async () => {
    await register('/register');

    expect(await screen.findByText('Set up your team')).toBeInTheDocument();
  });

  it('sends an invited account to verify its email, which adds it to the team', async () => {
    await register('/register?email=new.coach%40example.com');

    expect(await screen.findByText('Verify your email')).toBeInTheDocument();
  });
});

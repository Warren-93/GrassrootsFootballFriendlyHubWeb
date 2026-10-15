import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
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
});

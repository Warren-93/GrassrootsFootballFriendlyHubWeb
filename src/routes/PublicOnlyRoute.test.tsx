import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { useAuth } from '../auth/AuthContext';

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderPublicOnlyRoute(initialPath = '/welcome') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Dashboard content</div>} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/welcome" element={<div>Welcome page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicOnlyRoute', () => {
  it('shows a loading spinner while the session is still resolving', () => {
    mockedUseAuth.mockReturnValue({ session: null, loading: true } as ReturnType<typeof useAuth>);

    renderPublicOnlyRoute();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('lets a signed-out visitor see the auth page', () => {
    mockedUseAuth.mockReturnValue({ session: null, loading: false } as ReturnType<typeof useAuth>);

    renderPublicOnlyRoute();

    expect(screen.getByText('Welcome page')).toBeInTheDocument();
  });

  it('redirects an already-signed-in user away from the auth page, to the dashboard', () => {
    mockedUseAuth.mockReturnValue({
      session: { id: '1', email: 'a@example.com', displayName: 'A', emailVerified: true },
      loading: false,
    } as ReturnType<typeof useAuth>);

    renderPublicOnlyRoute();

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('Welcome page')).not.toBeInTheDocument();
  });
});

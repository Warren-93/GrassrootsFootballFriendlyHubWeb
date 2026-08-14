import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../auth/AuthContext';

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderProtectedRoute(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/welcome" element={<div>Welcome page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading spinner while the session is still resolving', () => {
    mockedUseAuth.mockReturnValue({ session: null, loading: true } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('redirects a signed-out user to /welcome instead of rendering the protected content', () => {
    mockedUseAuth.mockReturnValue({ session: null, loading: false } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByText('Welcome page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders the protected content once a session is present', () => {
    mockedUseAuth.mockReturnValue({
      session: { id: '1', email: 'a@example.com', displayName: 'A', emailVerified: true },
      loading: false,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});

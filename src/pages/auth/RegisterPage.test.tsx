import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { useAuth } from '../../auth/AuthContext';

vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mocked(useAuth).mockReturnValue({ resolveSession: vi.fn() } as unknown as ReturnType<typeof useAuth>);

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
  it('fills in the email from an invitation link', () => {
    renderAt('/register?email=new.coach%40example.com');

    expect(screen.getByLabelText('Email')).toHaveValue('new.coach@example.com');
  });

  it('starts with an empty email otherwise', () => {
    renderAt('/register');

    expect(screen.getByLabelText('Email')).toHaveValue('');
  });
});

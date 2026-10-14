import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ResetPasswordPage } from './ResetPasswordPage';
import { authRepository } from '../../api/authRepository';

vi.mock('../../api/authRepository', () => ({
  authRepository: { confirmPasswordReset: vi.fn() },
}));

const confirmPasswordReset = vi.mocked(authRepository.confirmPasswordReset);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  it('sends the token from the link with the new password', async () => {
    confirmPasswordReset.mockResolvedValue({ ok: true, value: undefined } as Awaited<
      ReturnType<typeof authRepository.confirmPasswordReset>
    >);
    renderAt('/reset-password?token=abc123');

    await userEvent.type(screen.getByLabelText(/^New password/), 'BrandNewPass1');
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'BrandNewPass1');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(confirmPasswordReset).toHaveBeenCalledWith('abc123', 'BrandNewPass1');
    expect(await screen.findByText(/Your password has been changed/)).toBeInTheDocument();
  });

  it('keeps the button disabled until both passwords match and are long enough', async () => {
    renderAt('/reset-password?token=abc123');

    await userEvent.type(screen.getByLabelText(/^New password/), 'short');
    expect(screen.getByRole('button', { name: 'Change password' })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/^New password/));
    await userEvent.type(screen.getByLabelText(/^New password/), 'BrandNewPass1');
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'Different123');
    expect(screen.getByRole('button', { name: 'Change password' })).toBeDisabled();
  });

  it('explains when the link has no token', () => {
    renderAt('/reset-password');

    expect(screen.getByText(/missing its reset code/)).toBeInTheDocument();
  });
});

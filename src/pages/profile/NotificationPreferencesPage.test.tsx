import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NotificationPreferencesPage } from './NotificationPreferencesPage';
import { notificationRepository } from '../../api/notificationRepository';
import type { NotificationPreferenceView } from '../../api/types';

vi.mock('../../api/notificationRepository', () => ({
  notificationRepository: { getPreferences: vi.fn(), updatePreferences: vi.fn() },
}));

const prefs: NotificationPreferenceView = {
  friendlyRequests: true,
  fixtures: true,
  verification: true,
  messages: true,
  emailEnabled: true,
  pushEnabled: false,
};

describe('NotificationPreferencesPage', () => {
  it('shows the email and phone switches and saves a change to them', async () => {
    vi.mocked(notificationRepository.getPreferences).mockResolvedValue({ ok: true, value: prefs });
    vi.mocked(notificationRepository.updatePreferences).mockResolvedValue({ ok: true, value: { ...prefs, emailEnabled: false } });
    render(
      <MemoryRouter initialEntries={['/settings/notifications']}>
        <NotificationPreferencesPage />
      </MemoryRouter>,
    );

    const emailSwitch = await screen.findByRole('switch', { name: /Email me/ });
    const phoneSwitch = screen.getByRole('switch', { name: /Phone notifications/ });
    expect(emailSwitch).toBeChecked();
    expect(phoneSwitch).not.toBeChecked();

    await userEvent.click(emailSwitch);

    expect(notificationRepository.updatePreferences).toHaveBeenCalledWith({ ...prefs, emailEnabled: false });
  });
});

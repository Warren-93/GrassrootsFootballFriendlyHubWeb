import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HelpPage } from './HelpPage';
import { configRepository } from '../../api/configRepository';
import { useClientConfigStore } from '../../session/ClientConfigState';
import type { ClientConfig } from '../../api/types';

vi.mock('../../api/configRepository', () => ({
  configRepository: { get: vi.fn() },
}));

const mockedGet = vi.mocked(configRepository.get);

function config(supportEmail: string | null): ClientConfig {
  return { supportEmail, google: { enabled: false, clientId: null }, apple: { enabled: false, servicesId: null } };
}

function renderHelp() {
  return render(
    <MemoryRouter initialEntries={['/settings/help']}>
      <HelpPage />
    </MemoryRouter>,
  );
}

describe('HelpPage', () => {
  beforeEach(() => {
    useClientConfigStore.setState({ config: null, status: 'idle' });
    vi.stubEnv('VITE_SUPPORT_EMAIL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emails the API's support address", async () => {
    mockedGet.mockResolvedValue({ ok: true, value: config('help@kickabout.example') });
    vi.stubEnv('VITE_SUPPORT_EMAIL', 'build@kickabout.example');

    renderHelp();

    expect(await screen.findByRole('link', { name: 'Message support' })).toHaveAttribute(
      'href',
      'mailto:help@kickabout.example',
    );
  });

  it('falls back to VITE_SUPPORT_EMAIL when the API has no address', async () => {
    mockedGet.mockResolvedValue({ ok: true, value: config(null) });
    vi.stubEnv('VITE_SUPPORT_EMAIL', 'build@kickabout.example');

    renderHelp();

    expect(await screen.findByRole('link', { name: 'Message support' })).toHaveAttribute(
      'href',
      'mailto:build@kickabout.example',
    );
  });

  it('hides the email button and points to the report form when there is no address', async () => {
    mockedGet.mockResolvedValue({ ok: true, value: config(null) });

    renderHelp();

    expect(await screen.findByText(/Use the report form/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Message support' })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('pitchmate');
  });
});

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { configRepository } from '../../api/configRepository';
import { useClientConfigStore } from '../../session/ClientConfigState';

vi.mock('../../api/configRepository', () => ({
  configRepository: { get: vi.fn() },
}));

const mockedGet = vi.mocked(configRepository.get);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('public policy pages', () => {
  beforeEach(() => {
    useClientConfigStore.setState({ config: null, status: 'idle' });
    mockedGet.mockResolvedValue({
      ok: true,
      value: { supportEmail: 'help@kickabout.example', google: { enabled: false, clientId: null }, apple: { enabled: false, servicesId: null } },
    });
  });

  it('shows the privacy policy without signing in', async () => {
    renderAt('/privacy-policy');
    expect(await screen.findByRole('heading', { name: 'Kickabout privacy policy' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'help@kickabout.example' })).toHaveAttribute(
      'href',
      'mailto:help@kickabout.example',
    );
  });

  it('explains account deletion without signing in', async () => {
    renderAt('/delete-account');
    expect(await screen.findByRole('heading', { name: 'Delete your Kickabout account' })).toBeInTheDocument();
    expect(screen.getByText('Open Settings, then Privacy and data.')).toBeInTheDocument();
  });
});

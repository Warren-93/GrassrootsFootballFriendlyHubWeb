import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSupportEmail, useClientConfig, useClientConfigStore } from './ClientConfigState';
import { configRepository } from '../api/configRepository';
import type { ClientConfig } from '../api/types';

vi.mock('../api/configRepository', () => ({
  configRepository: { get: vi.fn() },
}));

const mockedGet = vi.mocked(configRepository.get);

const config: ClientConfig = {
  supportEmail: 'help@kickabout.example',
  google: { enabled: true, clientId: 'abc.apps.googleusercontent.com' },
  apple: { enabled: false, servicesId: null },
};

describe('useClientConfig', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    useClientConfigStore.setState({ config: null, status: 'idle' });
  });

  it('fetches the config once and shares it between screens', async () => {
    mockedGet.mockResolvedValue({ ok: true, value: config });

    const first = renderHook(() => useClientConfig());
    await waitFor(() => expect(first.result.current.config).toEqual(config));
    const second = renderHook(() => useClientConfig());

    expect(second.result.current).toEqual({ config, loading: false });
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('tries again on the next use when the fetch failed', async () => {
    mockedGet.mockResolvedValueOnce({ ok: false, message: 'Network error' });
    const first = renderHook(() => useClientConfig());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.config).toBeNull();

    mockedGet.mockResolvedValueOnce({ ok: true, value: config });
    const second = renderHook(() => useClientConfig());

    await waitFor(() => expect(second.result.current.config).toEqual(config));
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});

describe('resolveSupportEmail', () => {
  it("prefers the API's support address", () => {
    expect(resolveSupportEmail(config, 'build@kickabout.example')).toBe('help@kickabout.example');
  });

  it('falls back to the build-time address', () => {
    expect(resolveSupportEmail({ ...config, supportEmail: null }, 'build@kickabout.example')).toBe('build@kickabout.example');
    expect(resolveSupportEmail(null, 'build@kickabout.example')).toBe('build@kickabout.example');
  });

  it('is null when neither is set', () => {
    expect(resolveSupportEmail({ ...config, supportEmail: null }, undefined)).toBeNull();
    expect(resolveSupportEmail(null, '')).toBeNull();
  });
});

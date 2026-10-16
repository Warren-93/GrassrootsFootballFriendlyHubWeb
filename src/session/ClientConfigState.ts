// The API's public client config (support address, which sign-in providers
// are on). Fetched once per page load and shared by every screen that needs
// it - the API marks it cacheable for 5 minutes, and nothing in it changes
// while a tab is open. A failed fetch isn't cached, so the next screen that
// asks tries again.
import { useEffect } from 'react';
import { create } from 'zustand';
import { configRepository } from '../api/configRepository';
import type { ClientConfig } from '../api/types';

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';

interface ClientConfigState {
  config: ClientConfig | null;
  status: LoadStatus;
  load: () => Promise<void>;
}

export const useClientConfigStore = create<ClientConfigState>((set, get) => ({
  config: null,
  status: 'idle',
  load: async () => {
    if (get().status === 'loading' || get().status === 'loaded') return;
    set({ status: 'loading' });
    const result = await configRepository.get();
    if (result.ok) set({ config: result.value, status: 'loaded' });
    else set({ status: 'failed' });
  },
}));

/** The client config, loading it on first use. `config` stays null while loading or if the API can't be reached. */
export function useClientConfig(): { config: ClientConfig | null; loading: boolean } {
  const config = useClientConfigStore((s) => s.config);
  const status = useClientConfigStore((s) => s.status);
  const load = useClientConfigStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return { config, loading: status === 'idle' || status === 'loading' };
}

/**
 * Where "Message support" goes: the API's configured support address, else
 * the build's VITE_SUPPORT_EMAIL, else nowhere (the Help page then points
 * people at Report instead of guessing an inbox).
 */
export function resolveSupportEmail(config: ClientConfig | null, fallback: string | undefined): string | null {
  return config?.supportEmail?.trim() || fallback?.trim() || null;
}

import { apiClient } from './client';
import type { ClientConfig } from './types';

export const configRepository = {
  get: () => apiClient.get<ClientConfig>('/api/v1/config', undefined, false),
};

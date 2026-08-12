import { apiClient } from './client';
import type { AccountExport } from './types';

export const privacyRepository = {
  export: () => apiClient.get<AccountExport>('/api/v1/me/export'),
  deleteAccount: () => apiClient.delete<void>('/api/v1/me'),
};

import { apiClient } from './client';
import type { FixtureView } from './types';

export const fixtureRepository = {
  list: (teamId: string) => apiClient.get<FixtureView[]>('/api/v1/fixtures', { teamId }),
  get: (id: string) => apiClient.get<FixtureView>(`/api/v1/fixtures/${id}`),
};

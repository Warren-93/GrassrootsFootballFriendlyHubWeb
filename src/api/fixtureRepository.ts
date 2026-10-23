import { apiClient } from './client';
import type { FixtureView, UpdateFixtureBody } from './types';

export const fixtureRepository = {
  list: (teamId: string) => apiClient.get<FixtureView[]>('/api/v1/fixtures', { teamId }),
  get: (id: string) => apiClient.get<FixtureView>(`/api/v1/fixtures/${id}`),
  cancel: (id: string, reason?: string) =>
    apiClient.post<FixtureView>(`/api/v1/fixtures/${id}/cancel`, { reason: reason || null }),
  /** League fixtures only. */
  update: (id: string, body: UpdateFixtureBody) => apiClient.patch<FixtureView>(`/api/v1/fixtures/${id}`, body),
};

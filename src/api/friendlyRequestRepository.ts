import { apiClient } from './client';
import type { FriendlyRequestView, SendRequestBody } from './types';

export const friendlyRequestRepository = {
  send: (request: SendRequestBody) =>
    apiClient.post<FriendlyRequestView>('/api/v1/friendly-requests', request),
  act: (id: string, action: string, reason?: string) =>
    apiClient.post<FriendlyRequestView>(
      `/api/v1/friendly-requests/${id}/actions/${action}`,
      reason ? { reason } : undefined,
    ),
  list: (teamId: string) =>
    apiClient.get<FriendlyRequestView[]>('/api/v1/friendly-requests', { teamId }),
  get: (id: string) => apiClient.get<FriendlyRequestView>(`/api/v1/friendly-requests/${id}`),
};

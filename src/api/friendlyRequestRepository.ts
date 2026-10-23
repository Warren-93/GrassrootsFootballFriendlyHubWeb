import { apiClient } from './client';
import type { CreateLeagueFixtureBody, FriendlyRequestView, SendRequestBody, SuggestChangesBody } from './types';

export const friendlyRequestRepository = {
  send: (request: SendRequestBody, idempotencyKey?: string) =>
    apiClient.post<FriendlyRequestView>(
      '/api/v1/friendly-requests',
      request,
      true,
      idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    ),
  /** The home team adds a league fixture; the away team then accepts, asks for a change or declines it like a friendly. */
  createLeague: (body: CreateLeagueFixtureBody, idempotencyKey?: string) =>
    apiClient.post<FriendlyRequestView>(
      '/api/v1/friendly-requests/league',
      body,
      true,
      idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    ),
  act: (id: string, action: string, reason?: string) =>
    apiClient.post<FriendlyRequestView>(
      `/api/v1/friendly-requests/${id}/actions/${action}`,
      reason ? { reason } : undefined,
    ),
  suggestChanges: (id: string, body: SuggestChangesBody) =>
    apiClient.post<FriendlyRequestView>(`/api/v1/friendly-requests/${id}/actions/suggestChanges`, body),
  list: (teamId: string) =>
    apiClient.get<FriendlyRequestView[]>('/api/v1/friendly-requests', { teamId }),
  get: (id: string) => apiClient.get<FriendlyRequestView>(`/api/v1/friendly-requests/${id}`),
};

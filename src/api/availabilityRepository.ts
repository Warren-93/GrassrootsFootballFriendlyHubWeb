import { apiClient } from './client';
import type { CreateSlotRequest, SlotView } from './types';

export const availabilityRepository = {
  create: (teamId: string, request: CreateSlotRequest) =>
    apiClient.post<SlotView>(`/api/v1/teams/${teamId}/availability`, request),
  list: (teamId: string, from?: string, to?: string) =>
    apiClient.get<SlotView[]>(`/api/v1/teams/${teamId}/availability`, { from, to }),
  get: (teamId: string, slotId: string) =>
    apiClient.get<SlotView>(`/api/v1/teams/${teamId}/availability/${slotId}`),
  update: (teamId: string, slotId: string, request: CreateSlotRequest) =>
    apiClient.put<SlotView>(`/api/v1/teams/${teamId}/availability/${slotId}`, request),
  withdraw: (teamId: string, slotId: string) =>
    apiClient.delete<void>(`/api/v1/teams/${teamId}/availability/${slotId}`),
};

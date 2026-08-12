import { apiClient } from './client';
import type { ClubView, CreateClubRequest, UpdateClubRequest } from './types';

export const clubRepository = {
  create: (request: CreateClubRequest) => apiClient.post<ClubView>('/api/v1/clubs', request),
  get: (clubId: string) => apiClient.get<ClubView>(`/api/v1/clubs/${clubId}`),
  update: (clubId: string, request: UpdateClubRequest) =>
    apiClient.patch<ClubView>(`/api/v1/clubs/${clubId}`, request),
};

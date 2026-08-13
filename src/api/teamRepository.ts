import { apiClient } from './client';
import type { CreateTeamRequest, TeamView, UpdateTeamRequest } from './types';

export const teamRepository = {
  create: (request: CreateTeamRequest) => apiClient.post<TeamView>('/api/v1/teams', request),
  get: (teamId: string) => apiClient.get<TeamView>(`/api/v1/teams/${teamId}`),
  update: (teamId: string, request: UpdateTeamRequest) =>
    apiClient.patch<TeamView>(`/api/v1/teams/${teamId}`, request),
  listByClub: (clubId: string) => apiClient.get<TeamView[]>('/api/v1/teams', { clubId }),
  listMine: () => apiClient.get<TeamView[]>('/api/v1/teams/mine'),
  archive: (teamId: string) => apiClient.post<void>(`/api/v1/teams/${teamId}/archive`),
};

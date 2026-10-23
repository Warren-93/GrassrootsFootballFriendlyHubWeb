import { apiClient } from './client';
import type { CreateTeamRequest, PrivacyPreferences, TeamSummary, TeamView, UpdateTeamRequest } from './types';

export const teamRepository = {
  create: (request: CreateTeamRequest) => apiClient.post<TeamView>('/api/v1/teams', request),
  get: (teamId: string) => apiClient.get<TeamView>(`/api/v1/teams/${teamId}`),
  update: (teamId: string, request: UpdateTeamRequest) =>
    apiClient.patch<TeamView>(`/api/v1/teams/${teamId}`, request),
  listByClub: (clubId: string) => apiClient.get<TeamView[]>('/api/v1/teams', { clubId }),
  /** Any team on Kickabout by name or club, for picking a league opponent - no matching rules apply. */
  search: (query: string, excludeTeamId?: string) =>
    apiClient.get<TeamSummary[]>('/api/v1/teams/search', { q: query, excludeTeamId }),
  listMine: () => apiClient.get<TeamView[]>('/api/v1/teams/mine'),
  archive: (teamId: string) => apiClient.post<void>(`/api/v1/teams/${teamId}/archive`),
  getPrivacy: (teamId: string) => apiClient.get<PrivacyPreferences>(`/api/v1/teams/${teamId}/privacy`),
  updatePrivacy: (teamId: string, request: PrivacyPreferences) =>
    apiClient.patch<PrivacyPreferences>(`/api/v1/teams/${teamId}/privacy`, request),
};

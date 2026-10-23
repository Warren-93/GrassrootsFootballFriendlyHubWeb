import { apiClient } from './client';
import type { LeagueView, SaveLeagueBody } from './types';

export const leagueRepository = {
  list: (teamId: string) => apiClient.get<LeagueView[]>(`/api/v1/teams/${teamId}/leagues`),
  get: (leagueId: string) => apiClient.get<LeagueView>(`/api/v1/leagues/${leagueId}`),
  create: (teamId: string, body: SaveLeagueBody) => apiClient.post<LeagueView>(`/api/v1/teams/${teamId}/leagues`, body),
  update: (leagueId: string, body: SaveLeagueBody) => apiClient.patch<LeagueView>(`/api/v1/leagues/${leagueId}`, body),
  delete: (leagueId: string) => apiClient.delete<void>(`/api/v1/leagues/${leagueId}`),
};

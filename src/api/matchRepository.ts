import { apiClient } from './client';
import type { SearchRequest, SearchResponse } from './types';

export const matchRepository = {
  search: (request: SearchRequest) => apiClient.post<SearchResponse>('/api/v1/matches/search', request),
};

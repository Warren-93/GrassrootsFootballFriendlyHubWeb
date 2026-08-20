import { apiClient } from './client';
import type { BlockRequest, BlockView, SubmitReportRequest } from './types';

export const reportRepository = {
  submit: (teamId: string, request: SubmitReportRequest) =>
    apiClient.post<void>(`/api/v1/teams/${teamId}/reports`, request),
  block: (teamId: string, request: BlockRequest) =>
    apiClient.post<void>(`/api/v1/teams/${teamId}/blocks`, request),
  listBlocks: (teamId: string) => apiClient.get<BlockView[]>(`/api/v1/teams/${teamId}/blocks`),
  unblock: (teamId: string, blockId: string) =>
    apiClient.delete<void>(`/api/v1/teams/${teamId}/blocks/${blockId}`),
};

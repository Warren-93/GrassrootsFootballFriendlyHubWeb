import { apiClient } from './client';
import type { BlockRequest, SubmitReportRequest } from './types';

export const reportRepository = {
  submit: (teamId: string, request: SubmitReportRequest) =>
    apiClient.post<void>(`/api/v1/teams/${teamId}/reports`, request),
  block: (teamId: string, request: BlockRequest) =>
    apiClient.post<void>(`/api/v1/teams/${teamId}/blocks`, request),
};

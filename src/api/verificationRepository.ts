import { apiClient } from './client';
import type { SubmitVerificationRequest, VerificationRequestView } from './types';

export const verificationRepository = {
  getForTeam: (teamId: string) => apiClient.get<VerificationRequestView | null>(`/api/v1/teams/${teamId}/verification`),
  submit: (teamId: string, request: SubmitVerificationRequest) =>
    apiClient.post<VerificationRequestView>(`/api/v1/teams/${teamId}/verification`, request),
};

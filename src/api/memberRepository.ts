import { apiClient } from './client';
import type { AddMemberRequest, JoinCodeView, JoinResultView, MemberView, UpdateMemberRoleRequest } from './types';

export const memberRepository = {
  list: (teamId: string) => apiClient.get<MemberView[]>(`/api/v1/teams/${teamId}/members`),
  add: (teamId: string, request: AddMemberRequest) =>
    apiClient.post<MemberView>(`/api/v1/teams/${teamId}/members`, request),
  updateRole: (teamId: string, membershipId: string, request: UpdateMemberRoleRequest) =>
    apiClient.patch<MemberView>(`/api/v1/teams/${teamId}/members/${membershipId}`, request),
  remove: (teamId: string, membershipId: string) =>
    apiClient.delete<void>(`/api/v1/teams/${teamId}/members/${membershipId}`),
  joinCode: (teamId: string) => apiClient.get<JoinCodeView>(`/api/v1/teams/${teamId}/members/join-code`),
  regenerateJoinCode: (teamId: string) =>
    apiClient.post<JoinCodeView>(`/api/v1/teams/${teamId}/members/join-code/regenerate`),
  join: (code: string) => apiClient.post<JoinResultView>('/api/v1/teams/join', { code }),
};

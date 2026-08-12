import { apiClient } from './client';
import type { AddMemberRequest, MemberView, UpdateMemberRoleRequest } from './types';

export const memberRepository = {
  list: (teamId: string) => apiClient.get<MemberView[]>(`/api/v1/teams/${teamId}/members`),
  add: (teamId: string, request: AddMemberRequest) =>
    apiClient.post<MemberView>(`/api/v1/teams/${teamId}/members`, request),
  updateRole: (teamId: string, membershipId: string, request: UpdateMemberRoleRequest) =>
    apiClient.patch<MemberView>(`/api/v1/teams/${teamId}/members/${membershipId}`, request),
  remove: (teamId: string, membershipId: string) =>
    apiClient.delete<void>(`/api/v1/teams/${teamId}/members/${membershipId}`),
};

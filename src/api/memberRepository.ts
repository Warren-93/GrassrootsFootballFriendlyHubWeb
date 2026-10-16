import { apiClient } from './client';
import type {
  AddMemberRequest,
  AddMemberResult,
  InviteView,
  JoinCodeView,
  JoinResultView,
  MemberInvitedResponse,
  MemberView,
  UpdateMemberRoleRequest,
} from './types';

/** True when adding by email sent an invitation (no account yet) rather than adding a member. */
export function isInvitation(result: AddMemberResult): result is MemberInvitedResponse {
  return 'status' in result && result.status === 'INVITED';
}

export const memberRepository = {
  list: (teamId: string) => apiClient.get<MemberView[]>(`/api/v1/teams/${teamId}/members`),
  add: (teamId: string, request: AddMemberRequest) =>
    apiClient.post<AddMemberResult>(`/api/v1/teams/${teamId}/members`, request),
  updateRole: (teamId: string, membershipId: string, request: UpdateMemberRoleRequest) =>
    apiClient.patch<MemberView>(`/api/v1/teams/${teamId}/members/${membershipId}`, request),
  remove: (teamId: string, membershipId: string) =>
    apiClient.delete<void>(`/api/v1/teams/${teamId}/members/${membershipId}`),
  listInvites: (teamId: string) => apiClient.get<InviteView[]>(`/api/v1/teams/${teamId}/members/invites`),
  cancelInvite: (teamId: string, inviteId: string) =>
    apiClient.delete<void>(`/api/v1/teams/${teamId}/members/invites/${inviteId}`),
  joinCode: (teamId: string) => apiClient.get<JoinCodeView>(`/api/v1/teams/${teamId}/members/join-code`),
  regenerateJoinCode: (teamId: string) =>
    apiClient.post<JoinCodeView>(`/api/v1/teams/${teamId}/members/join-code/regenerate`),
  join: (code: string) => apiClient.post<JoinResultView>('/api/v1/teams/join', { code }),
};

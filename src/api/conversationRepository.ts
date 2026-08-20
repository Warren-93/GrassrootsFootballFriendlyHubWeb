import { apiClient } from './client';
import type { ConversationView, MessageView } from './types';

export const conversationRepository = {
  start: (teamId: string, otherTeamId: string, fixtureId?: string) =>
    apiClient.post<ConversationView>('/api/v1/conversations', { teamId, otherTeamId, fixtureId }),
  list: (teamId: string) => apiClient.get<ConversationView[]>(`/api/v1/teams/${teamId}/conversations`),
  get: (conversationId: string) => apiClient.get<ConversationView>(`/api/v1/conversations/${conversationId}`),
  messages: (conversationId: string) =>
    apiClient.get<MessageView[]>(`/api/v1/conversations/${conversationId}/messages`),
  send: (conversationId: string, body: string) =>
    apiClient.post<MessageView>(`/api/v1/conversations/${conversationId}/messages`, { body }),
};

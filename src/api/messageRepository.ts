import { apiClient } from './client';
import type { MessageView } from './types';

export const messageRepository = {
  list: (fixtureId: string) => apiClient.get<MessageView[]>(`/api/v1/fixtures/${fixtureId}/messages`),
  send: (fixtureId: string, body: string) =>
    apiClient.post<MessageView>(`/api/v1/fixtures/${fixtureId}/messages`, { body }),
};

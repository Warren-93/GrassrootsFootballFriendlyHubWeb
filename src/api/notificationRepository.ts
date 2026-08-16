import { apiClient } from './client';
import type { NotificationPreferenceView, NotificationView } from './types';

export const notificationRepository = {
  list: () => apiClient.get<NotificationView[]>('/api/v1/notifications'),
  unreadCount: () => apiClient.get<{ count: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: string) => apiClient.post<void>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => apiClient.post<void>('/api/v1/notifications/read-all'),
  clearAll: () => apiClient.delete<void>('/api/v1/notifications'),
  getPreferences: () => apiClient.get<NotificationPreferenceView>('/api/v1/me/notification-preferences'),
  updatePreferences: (request: NotificationPreferenceView) =>
    apiClient.patch<NotificationPreferenceView>('/api/v1/me/notification-preferences', request),
};

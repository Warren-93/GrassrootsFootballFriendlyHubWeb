import { apiClient } from './client';
import { ok } from './result';
import type { NotificationPreferenceView, NotificationView } from './types';

export const notificationRepository = {
  list: () => apiClient.get<NotificationView[]>('/api/v1/notifications'),
  unreadCount: () => apiClient.get<{ count: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: string) => apiClient.post<void>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => apiClient.post<void>('/api/v1/notifications/read-all'),
  clearAll: () => apiClient.delete<void>('/api/v1/notifications'),
  // emailEnabled/pushEnabled default to on, matching the API, for a server
  // that doesn't send them yet.
  getPreferences: () =>
    apiClient
      .get<NotificationPreferenceView>('/api/v1/me/notification-preferences')
      .then((result) => {
        if (!result.ok) return result;
        const prefs = result.value;
        return ok({ ...prefs, emailEnabled: prefs.emailEnabled ?? true, pushEnabled: prefs.pushEnabled ?? true });
      }),
  updatePreferences: (request: NotificationPreferenceView) =>
    apiClient.patch<NotificationPreferenceView>('/api/v1/me/notification-preferences', request),
};

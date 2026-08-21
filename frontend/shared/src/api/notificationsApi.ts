import { apiClient } from "./apiClient";
import { AppNotification } from "../types/notification";

export const notificationsApi = {
  list: (unreadOnly = false) =>
    apiClient
      .get<AppNotification[]>("/notifications", { params: { unread: unreadOnly } })
      .then((r) => r.data),
  unreadCount: () =>
    apiClient.get<{ count: number }>("/notifications/unread-count").then((r) => r.data.count),
  markRead: (id: number) =>
    apiClient.patch<AppNotification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.patch("/notifications/read-all").then((r) => r.data),
};

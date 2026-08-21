import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/notificationsApi";

// Shared by both frontends. Polling (not a websocket) matches the rest of the app's
// pattern (see the dashboard's 30s refetch) — simple, no extra server infra, and 20s is
// fast enough that "HR sees a new leave request" feels close to live without needing one.
export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => notificationsApi.list(unreadOnly),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  return {
    markRead: async (id: number) => {
      await notificationsApi.markRead(id);
      invalidate();
    },
    markAllRead: async () => {
      await notificationsApi.markAllRead();
      invalidate();
    },
  };
}

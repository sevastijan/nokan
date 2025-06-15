"use client";

import { useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import {
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useMarkNotificationReadMutation,
} from "@/app/store/apiSlice";

/**
 * Hook for notifications. Adds `.taskUrl` for every notification (for task + board).
 */
export const useNotifications = (userId?: string) => {
  const {
    data: notifications = [],
    refetch,
    isLoading,
    isError,
    error,
  } = useGetNotificationsQuery(userId!, { skip: !userId });
  const [deleteNotification] = useDeleteNotificationMutation();
  const [markNotificationRead] = useMarkNotificationReadMutation();

  // Real-time updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  // Add .taskUrl field to every notification (generate on frontend)
  const notificationsWithUrl = notifications.map((notif: any) => ({
    ...notif,
    taskUrl:
      notif.board_id && notif.task_id
        ? `/board/${notif.board_id}?task=${notif.task_id}`
        : undefined,
  }));

  return {
    notifications: notificationsWithUrl,
    isLoading,
    isError,
    error,
    deleteNotification,
    markNotificationRead,
    unreadCount: notifications.filter((n: any) => !n.read).length,
  };
};

'use client';

import { useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useGetNotificationsQuery, useDeleteNotificationMutation, useMarkNotificationReadMutation } from '@/app/store/apiSlice';

interface Notification {
     id: string;
     user_id: string;
     board_id?: string | null;
     task_id?: string | null;
     read: boolean;
}

export const useNotifications = (userId?: string) => {
     const { data: notifications = [], refetch, isLoading, isError, error } = useGetNotificationsQuery(userId!, { skip: !userId });
     const [deleteNotification] = useDeleteNotificationMutation();
     const [markNotificationRead] = useMarkNotificationReadMutation();

     // Real-time updates
     useEffect(() => {
          if (!userId) return;

          const channel = supabase
               .channel('notifications')
               .on(
                    'postgres_changes',
                    {
                         event: '*',
                         schema: 'public',
                         table: 'notifications',
                         filter: `user_id=eq.${userId}`,
                    },
                    () => refetch(),
               )
               .subscribe();

          return () => {
               supabase.removeChannel(channel);
          };
     }, [userId, refetch]);

     const notificationsWithUrl = notifications.map((notif: Notification) => ({
          ...notif,
          taskUrl: notif.board_id && notif.task_id ? `/board/${notif.board_id}?task=${notif.task_id}` : undefined,
     }));

     const unreadCount = notifications.filter((n: Notification) => !n.read).length;

     return {
          notifications: notificationsWithUrl,
          isLoading,
          isError,
          error,
          deleteNotification,
          markNotificationRead,
          unreadCount,
     };
};

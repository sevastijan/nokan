'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getSupabase } from '@/app/lib/supabase';
import { apiSlice } from '@/app/store/apiSlice';
import type { AppDispatch } from '@/app/store';

/**
 * Global Postgres Changes listener on notifications table.
 * Runs at app root (ClientLayout).
 *
 * Responsibilities:
 * 1. Play /notification.mp3 when a new notification arrives
 * 2. Show browser push notification
 * 3. Flash tab title
 * 4. Invalidate Notification cache so the dropdown updates live
 */
export function useGlobalNotification(currentUserId: string | null) {
     const dispatch = useDispatch<AppDispatch>();
     const originalTitleRef = useRef('');
     const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
     const audioRef = useRef<HTMLAudioElement | null>(null);

     // Preload notification sound & unlock audio on first user interaction
     useEffect(() => {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.preload = 'auto';
          audioRef.current = audio;

          const unlock = () => {
               audio.play()
                    .then(() => {
                         audio.pause();
                         audio.currentTime = 0;
                         // Only remove listeners after successful unlock
                         window.removeEventListener('click', unlock);
                         window.removeEventListener('keydown', unlock);
                    })
                    .catch(() => {
                         // Keep listeners — will retry on next interaction
                    });
          };
          window.addEventListener('click', unlock);
          window.addEventListener('keydown', unlock);

          return () => {
               window.removeEventListener('click', unlock);
               window.removeEventListener('keydown', unlock);
          };
     }, []);

     // Store original title
     useEffect(() => {
          originalTitleRef.current = document.title;
     }, []);

     // Reset title on focus
     useEffect(() => {
          const handleFocus = () => {
               if (titleIntervalRef.current) {
                    clearInterval(titleIntervalRef.current);
                    titleIntervalRef.current = null;
               }
               document.title = originalTitleRef.current;
          };
          window.addEventListener('focus', handleFocus);
          return () => {
               window.removeEventListener('focus', handleFocus);
               if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
          };
     }, []);

     useEffect(() => {
          if (!currentUserId) return;

          const supabase = getSupabase();

          const channel = supabase
               .channel('global-notifications')
               .on(
                    'postgres_changes',
                    {
                         event: 'INSERT',
                         schema: 'public',
                         table: 'notifications',
                         filter: `user_id=eq.${currentUserId}`,
                    },
                    (payload) => {
                         const record = payload.new as Record<string, unknown>;

                         // Invalidate notification cache so dropdown updates live
                         dispatch(apiSlice.util.invalidateTags([{ type: 'Notification', id: currentUserId }]));

                         const message = (record.message as string) || '';
                         const preview = message.length > 80 ? message.slice(0, 80) + '...' : message;

                         // Play notification sound
                         if (audioRef.current) {
                              audioRef.current.currentTime = 0;
                              audioRef.current.play().catch(() => {});
                         }

                         // Tab title flash (only when not focused)
                         if (!document.hasFocus()) {
                              if (!titleIntervalRef.current) {
                                   let flash = true;
                                   titleIntervalRef.current = setInterval(() => {
                                        document.title = flash ? originalTitleRef.current : 'Nowe powiadomienie!';
                                        flash = !flash;
                                   }, 1500);
                                   document.title = 'Nowe powiadomienie!';
                              }

                              // Browser push notification
                              try {
                                   if ('Notification' in window && Notification.permission === 'granted') {
                                        new Notification('Nowe powiadomienie', {
                                             body: preview,
                                             icon: '/icon-192x192.png',
                                             tag: `notification-${record.id}`,
                                        });
                                   }
                              } catch {
                                   // Notification API not available
                              }
                         }
                    },
               )
               .subscribe();

          return () => {
               supabase.removeChannel(channel);
          };
     }, [currentUserId, dispatch]);
}

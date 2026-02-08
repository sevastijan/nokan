'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getSupabase } from '@/app/lib/supabase';
import { apiSlice } from '@/app/store/apiSlice';
import type { AppDispatch } from '@/app/store';

/**
 * Global Postgres Changes listener on chat_messages + chat_channel_members.
 * Runs at app root (ClientLayout) — not tied to any specific channel.
 *
 * Responsibilities:
 * 1. Show browser tab title + push notification when a new message arrives
 * 2. Invalidate ChatChannelList cache so unread badges update globally
 * 3. Detect new channel membership (e.g. someone creates a DM with you)
 *    and refresh the channel list so the conversation appears instantly
 */
export function useGlobalChatNotification(currentUserId: string | null) {
     const dispatch = useDispatch<AppDispatch>();
     const originalTitleRef = useRef('');
     const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
     const audioRef = useRef<HTMLAudioElement | null>(null);

     // Preload notification sound & unlock audio on first user interaction
     useEffect(() => {
          const audio = new Audio('/message-sound.mp3');
          audio.volume = 0.2;
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
               .channel('global-chat-notifications')
               // ── New messages → unread badges + browser notifications ──
               .on(
                    'postgres_changes',
                    {
                         event: 'INSERT',
                         schema: 'public',
                         table: 'chat_messages',
                    },
                    (payload) => {
                         const record = payload.new as Record<string, unknown>;

                         // Skip own messages
                         if (record.user_id === currentUserId) return;
                         // Skip deleted messages
                         if (record.is_deleted) return;

                         // Invalidate channel list to update unread badges
                         dispatch(apiSlice.util.invalidateTags([{ type: 'ChatChannelList', id: currentUserId }]));

                         // Show notifications only when tab is not focused
                         if (!document.hasFocus()) {
                              const content = (record.content as string) || '';
                              const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;

                              // Play notification sound
                              if (audioRef.current) {
                                   audioRef.current.currentTime = 0;
                                   audioRef.current.play().catch(() => {});
                              }

                              // Tab title flash
                              if (!titleIntervalRef.current) {
                                   let flash = true;
                                   titleIntervalRef.current = setInterval(() => {
                                        document.title = flash ? originalTitleRef.current : 'Nowa wiadomość!';
                                        flash = !flash;
                                   }, 1500);
                                   document.title = 'Nowa wiadomość!';
                              }

                              // Browser push notification
                              try {
                                   if ('Notification' in window && Notification.permission === 'granted') {
                                        new Notification('Nowa wiadomość', {
                                             body: preview,
                                             icon: '/icon-192x192.png',
                                             tag: `chat-${record.id}`,
                                        });
                                   }
                              } catch {
                                   // Notification API not available
                              }
                         }
                    },
               )
               // ── New channel membership → conversation appears in sidebar ──
               // Catches: someone creates a DM with you, or adds you to a group.
               .on(
                    'postgres_changes',
                    {
                         event: 'INSERT',
                         schema: 'public',
                         table: 'chat_channel_members',
                         filter: `user_id=eq.${currentUserId}`,
                    },
                    () => {
                         dispatch(apiSlice.util.invalidateTags([{ type: 'ChatChannelList', id: currentUserId }]));
                    },
               )
               .subscribe();

          return () => {
               supabase.removeChannel(channel);
          };
     }, [currentUserId, dispatch]);
}

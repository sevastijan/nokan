'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getSupabase } from '@/app/lib/supabase';
import { apiSlice } from '@/app/store/apiSlice';
import type { AppDispatch } from '@/app/store';

/**
 * Global Postgres Changes listener on chat_messages table.
 * Runs at app root (ClientLayout) — not tied to any specific channel.
 *
 * Responsibilities:
 * 1. Show browser tab title + push notification when a new message arrives
 * 2. Invalidate ChatChannelList cache so unread badges update globally
 */
export function useGlobalChatNotification(currentUserId: string | null) {
	const dispatch = useDispatch<AppDispatch>();
	const originalTitleRef = useRef('');
	const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

	// Request notification permission
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}, []);

	useEffect(() => {
		if (!currentUserId) return;

		const supabase = getSupabase();

		const channel = supabase
			.channel('global-chat-notifications')
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
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [currentUserId, dispatch]);
}

'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/app/store/endpoints/chatEndpoints';
import { getUserDisplayName } from '@/app/components/Chat/utils';

/**
 * Shows browser tab title change + native notification
 * when a new message arrives from another user.
 */
export function useChatNotification(
	messages: ChatMessage[],
	currentUserId: string,
	isActive: boolean
) {
	const prevCountRef = useRef<number | null>(null);
	const originalTitleRef = useRef('');
	const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Store original title
	useEffect(() => {
		originalTitleRef.current = document.title;
	}, []);

	// Reset title on focus
	useEffect(() => {
		const handleFocus = () => {
			if (titleTimeoutRef.current) {
				clearTimeout(titleTimeoutRef.current);
				titleTimeoutRef.current = null;
			}
			document.title = originalTitleRef.current;
		};
		window.addEventListener('focus', handleFocus);
		return () => {
			window.removeEventListener('focus', handleFocus);
			if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
		};
	}, []);

	// Request notification permission on mount
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}, []);

	useEffect(() => {
		if (!isActive || !currentUserId) return;

		// Skip first render — just record the initial count
		if (prevCountRef.current === null) {
			prevCountRef.current = messages.length;
			return;
		}

		const prevCount = prevCountRef.current;
		const newCount = messages.length;
		prevCountRef.current = newCount;

		if (newCount <= prevCount) return;

		// Find latest message from another user
		const latestMsg = messages[messages.length - 1];
		if (!latestMsg || latestMsg.user_id === currentUserId) return;

		const senderName = getUserDisplayName(latestMsg.user);

		// Tab title notification (always works)
		if (!document.hasFocus()) {
			document.title = `${senderName} napisał(a) do Ciebie`;

			// Flash title back and forth
			let flash = true;
			titleTimeoutRef.current = setInterval(() => {
				document.title = flash ? originalTitleRef.current : `${senderName} napisał(a) do Ciebie`;
				flash = !flash;
			}, 1500);
		}

		// Browser push notification
		try {
			if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
				const preview = latestMsg.content.length > 80
					? latestMsg.content.slice(0, 80) + '...'
					: latestMsg.content;

				new Notification(`${senderName} napisał(a)`, {
					body: preview,
					icon: '/icon-192x192.png',
					tag: `chat-${latestMsg.id}`,
				});
			}
		} catch {
			// Notification API not available — ignore
		}
	}, [messages, currentUserId, isActive]);
}

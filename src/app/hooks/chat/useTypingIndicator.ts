'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabase } from '@/app/lib/supabase';

interface TypingUser {
	userId: string;
	userName: string;
}

/**
 * Supabase Broadcast for typing indicators.
 * Sends typing events debounced (500ms), clears after 3s timeout.
 */
export function useTypingIndicator(channelId: string, currentUserId: string) {
	const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
	const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null);
	const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
	const lastSentRef = useRef<number>(0);

	useEffect(() => {
		if (!channelId || !currentUserId) return;

		const supabase = getSupabase();
		const channel = supabase.channel(`typing:${channelId}`);

		channel
			.on('broadcast', { event: 'typing' }, (payload) => {
				const { userId, userName } = payload.payload as TypingUser;
				if (userId === currentUserId) return;

				setTypingUsers((prev) => {
					const exists = prev.find((u) => u.userId === userId);
					if (!exists) return [...prev, { userId, userName }];
					return prev;
				});

				// Clear existing timeout for this user
				const existing = timeoutsRef.current.get(userId);
				if (existing) clearTimeout(existing);

				// Set new timeout to remove after 3s
				const timeout = setTimeout(() => {
					setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
					timeoutsRef.current.delete(userId);
				}, 3000);

				timeoutsRef.current.set(userId, timeout);
			})
			.subscribe();

		channelRef.current = channel;

		return () => {
			supabase.removeChannel(channel);
			channelRef.current = null;
			// Clear all timeouts
			timeoutsRef.current.forEach((t) => clearTimeout(t));
			timeoutsRef.current.clear();
			setTypingUsers([]);
		};
	}, [channelId, currentUserId]);

	const sendTyping = useCallback(
		(userName: string) => {
			const now = Date.now();
			// Debounce: only send every 500ms
			if (now - lastSentRef.current < 500) return;
			lastSentRef.current = now;

			channelRef.current?.send({
				type: 'broadcast',
				event: 'typing',
				payload: { userId: currentUserId, userName },
			});
		},
		[currentUserId]
	);

	return { typingUsers, sendTyping };
}

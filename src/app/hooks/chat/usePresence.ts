'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '@/app/lib/supabase';

/**
 * Supabase Presence for online/offline status.
 * Tracks all online users globally via a single 'online-users' channel.
 */
export function usePresence(currentUserId: string | null) {
	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
	const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null);

	useEffect(() => {
		if (!currentUserId) return;

		const supabase = getSupabase();
		const channel = supabase.channel('online-users', {
			config: { presence: { key: currentUserId } },
		});

		channel
			.on('presence', { event: 'sync' }, () => {
				const state = channel.presenceState();
				const ids = new Set<string>(Object.keys(state));
				setOnlineUserIds(ids);
			})
			.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
				}
			});

		channelRef.current = channel;

		return () => {
			supabase.removeChannel(channel);
			channelRef.current = null;
		};
	}, [currentUserId]);

	return { onlineUserIds };
}

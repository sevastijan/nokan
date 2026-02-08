'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getSupabase } from '@/app/lib/supabase';
import { setOnlineUserIds } from '@/app/store/slices/chatUiSlice';
import type { AppDispatch } from '@/app/store';

/**
 * Supabase Presence for online/offline status.
 * Tracks all online users globally via a single 'online-users' channel.
 * Dispatches to Redux so any component can read via selector.
 */
export function usePresence(currentUserId: string | null) {
	const dispatch = useDispatch<AppDispatch>();
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
				const ids = Object.keys(state);
				dispatch(setOnlineUserIds(ids));
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
	}, [currentUserId, dispatch]);
}

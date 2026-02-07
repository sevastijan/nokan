'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '@/app/lib/supabase';
import { apiSlice } from '@/app/store/apiSlice';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/app/store';

/**
 * Uses Supabase Broadcast (same as typing — proven to work)
 * to notify other clients about new/updated messages.
 * On receiving a broadcast event, invalidates RTK cache to trigger refetch.
 */
export function useRealtimeMessages(channelId: string | null, currentUserId: string) {
	const dispatch = useDispatch<AppDispatch>();
	const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null);

	useEffect(() => {
		if (!channelId) return;

		const supabase = getSupabase();

		const channel = supabase
			.channel(`chat-sync:${channelId}`)
			.on('broadcast', { event: 'new_message' }, (payload) => {
				const senderId = payload.payload?.userId as string | undefined;

				// Skip own events (already in cache from mutation)
				if (senderId === currentUserId) return;

				// Invalidate cache → triggers refetch of messages
				dispatch(apiSlice.util.invalidateTags([{ type: 'ChatMessages', id: channelId }]));
				dispatch(apiSlice.util.invalidateTags([{ type: 'ChatChannelList', id: currentUserId }]));
			})
			.on('broadcast', { event: 'message_updated' }, (payload) => {
				const senderId = payload.payload?.userId as string | undefined;
				if (senderId === currentUserId) return;

				dispatch(apiSlice.util.invalidateTags([{ type: 'ChatMessages', id: channelId }]));
			})
			.on('broadcast', { event: 'reaction_updated' }, (payload) => {
				const senderId = payload.payload?.userId as string | undefined;
				if (senderId === currentUserId) return;

				dispatch(apiSlice.util.invalidateTags([{ type: 'ChatMessages', id: channelId }]));
			})
			.subscribe((status) => {
				console.log('[Chat Sync] Subscribe status:', status, 'channel:', channelId);
			});

		channelRef.current = channel;

		return () => {
			supabase.removeChannel(channel);
			channelRef.current = null;
		};
	}, [channelId, currentUserId, dispatch]);

	/** Broadcast a new message event to other clients in this channel */
	const broadcastNewMessage = useCallback(() => {
		channelRef.current?.send({
			type: 'broadcast',
			event: 'new_message',
			payload: { userId: currentUserId },
		});
	}, [currentUserId]);

	/** Broadcast a message update (edit/delete) event */
	const broadcastMessageUpdate = useCallback(() => {
		channelRef.current?.send({
			type: 'broadcast',
			event: 'message_updated',
			payload: { userId: currentUserId },
		});
	}, [currentUserId]);

	/** Broadcast a reaction change event */
	const broadcastReactionUpdate = useCallback(() => {
		channelRef.current?.send({
			type: 'broadcast',
			event: 'reaction_updated',
			payload: { userId: currentUserId },
		});
	}, [currentUserId]);

	return { broadcastNewMessage, broadcastMessageUpdate, broadcastReactionUpdate };
}

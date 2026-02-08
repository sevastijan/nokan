'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '@/app/lib/supabase';
import { apiSlice } from '@/app/store/apiSlice';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/app/store';

/**
 * Dual realtime strategy for instant chat updates:
 * 1. Postgres Changes (DB-level) — primary, most reliable, fires on any INSERT/UPDATE/DELETE
 * 2. Broadcast — secondary fast-path for when both clients are subscribed
 *
 * On receiving any event, invalidates RTK cache to trigger refetch.
 */
export function useRealtimeMessages(channelId: string | null, currentUserId: string) {
	const dispatch = useDispatch<AppDispatch>();
	const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>['channel']> | null>(null);
	const subscribedRef = useRef(false);

	// Debounce invalidation — multiple events can fire within ms of each other
	const invalidateTimerRef = useRef<NodeJS.Timeout | null>(null);
	const invalidateMessages = useCallback(
		(cId: string) => {
			if (invalidateTimerRef.current) return; // already scheduled
			invalidateTimerRef.current = setTimeout(() => {
				dispatch(apiSlice.util.invalidateTags([{ type: 'ChatMessages', id: cId }]));
				dispatch(apiSlice.util.invalidateTags([{ type: 'ChatChannelList', id: currentUserId }]));
				invalidateTimerRef.current = null;
			}, 100);
		},
		[dispatch, currentUserId]
	);

	useEffect(() => {
		if (!channelId) return;

		subscribedRef.current = false;
		const supabase = getSupabase();

		// Determine if this is a thread channel (thread:parentId) or regular channel
		const isThread = channelId.startsWith('thread:');
		const dbChannelId = isThread ? channelId.replace('thread:', '') : channelId;
		const cacheTag = isThread ? `thread-${dbChannelId}` : channelId;

		const channel = supabase
			.channel(`chat-sync:${channelId}`)
			// --- Postgres Changes: DB-level realtime (primary) ---
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'chat_messages',
					filter: isThread ? `parent_id=eq.${dbChannelId}` : `channel_id=eq.${dbChannelId}`,
				},
				(payload) => {
					// Skip own inserts (already in cache from optimistic mutation)
					const record = (payload.new as Record<string, unknown>) || {};
					if (payload.eventType === 'INSERT' && record.user_id === currentUserId) return;

					dispatch(apiSlice.util.invalidateTags([{ type: 'ChatMessages', id: cacheTag }]));
					dispatch(apiSlice.util.invalidateTags([{ type: 'ChatChannelList', id: currentUserId }]));
				}
			)
			// --- Broadcast: fast-path (secondary, also handles reactions) ---
			.on('broadcast', { event: 'new_message' }, (payload) => {
				const senderId = payload.payload?.userId as string | undefined;
				if (senderId === currentUserId) return;
				invalidateMessages(cacheTag);
			})
			.on('broadcast', { event: 'message_updated' }, (payload) => {
				const senderId = payload.payload?.userId as string | undefined;
				if (senderId === currentUserId) return;
				invalidateMessages(cacheTag);
			})
			.on('broadcast', { event: 'reaction_updated' }, (payload) => {
				const senderId = payload.payload?.userId as string | undefined;
				if (senderId === currentUserId) return;
				invalidateMessages(cacheTag);
			})
			.subscribe((status) => {
				if (status === 'SUBSCRIBED') {
					subscribedRef.current = true;
				}
			});

		channelRef.current = channel;

		return () => {
			supabase.removeChannel(channel);
			channelRef.current = null;
			subscribedRef.current = false;
			if (invalidateTimerRef.current) {
				clearTimeout(invalidateTimerRef.current);
				invalidateTimerRef.current = null;
			}
		};
	}, [channelId, currentUserId, dispatch, invalidateMessages]);

	/** Broadcast a new message event to other clients in this channel */
	const broadcastNewMessage = useCallback(() => {
		if (!subscribedRef.current) return;
		channelRef.current?.send({
			type: 'broadcast',
			event: 'new_message',
			payload: { userId: currentUserId },
		});
	}, [currentUserId]);

	/** Broadcast a message update (edit/delete) event */
	const broadcastMessageUpdate = useCallback(() => {
		if (!subscribedRef.current) return;
		channelRef.current?.send({
			type: 'broadcast',
			event: 'message_updated',
			payload: { userId: currentUserId },
		});
	}, [currentUserId]);

	/** Broadcast a reaction change event */
	const broadcastReactionUpdate = useCallback(() => {
		if (!subscribedRef.current) return;
		channelRef.current?.send({
			type: 'broadcast',
			event: 'reaction_updated',
			payload: { userId: currentUserId },
		});
	}, [currentUserId]);

	return { broadcastNewMessage, broadcastMessageUpdate, broadcastReactionUpdate };
}

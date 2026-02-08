import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { triggerPushNotification } from '@/app/lib/pushNotification';

// === Types ===

export interface ChatChannel {
	id: string;
	name: string | null;
	type: 'dm' | 'group';
	description: string | null;
	created_by: string;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
	last_message?: ChatMessage | null;
	unread_count?: number;
	members?: ChatChannelMember[];
}

export interface ChatChannelMember {
	id: string;
	channel_id: string;
	user_id: string;
	role: 'admin' | 'member';
	last_read_at: string;
	muted: boolean;
	joined_at: string;
	user?: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
		custom_name: string | null;
		custom_image: string | null;
	};
}

export interface ChatMessage {
	id: string;
	channel_id: string;
	user_id: string;
	content: string;
	parent_id: string | null;
	is_edited: boolean;
	is_deleted: boolean;
	is_pinned: boolean;
	pinned_by: string | null;
	pinned_at: string | null;
	created_at: string;
	updated_at: string;
	user?: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
		custom_name: string | null;
		custom_image: string | null;
	};
	reactions?: ChatReaction[];
	attachments?: ChatAttachment[];
	reply_count?: number;
}

export interface ChatReaction {
	id: string;
	message_id: string;
	user_id: string;
	emoji: string;
	created_at: string;
}

export interface ChatAttachment {
	id: string;
	message_id: string;
	file_name: string;
	file_path: string;
	file_size: number;
	mime_type: string;
	uploaded_by: string;
	created_at: string;
}

// === Endpoints ===

export const chatEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
	// ─── Queries ───

	getUserChannels: builder.query<ChatChannel[], string>({
		async queryFn(userId) {
			try {
				const supabase = getSupabase();

				// Get all channels user is a member of
				const { data: memberships, error: memErr } = await supabase
					.from('chat_channel_members')
					.select('channel_id, last_read_at')
					.eq('user_id', userId);

				if (memErr) throw memErr;
				if (!memberships || memberships.length === 0) return { data: [] };

				const channelIds = memberships.map((m) => m.channel_id);
				const lastReadMap = new Map(memberships.map((m) => [m.channel_id, m.last_read_at]));

				// Get channels with members
				const { data: channels, error: chErr } = await supabase
					.from('chat_channels')
					.select(
						`
						*,
						members:chat_channel_members(
							id, channel_id, user_id, role, last_read_at, muted, joined_at,
							user:users(id, name, email, image, custom_name, custom_image)
						)
					`
					)
					.in('id', channelIds)
					.order('updated_at', { ascending: false });

				if (chErr) throw chErr;

				// For each channel, get last message and unread count
				const enriched: ChatChannel[] = await Promise.all(
					(channels || []).map(async (ch) => {
						// Last message
						const { data: lastMsgs } = await supabase
							.from('chat_messages')
							.select(
								`
								*,
								user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image)
							`
							)
							.eq('channel_id', ch.id)
							.is('parent_id', null)
							.order('created_at', { ascending: false })
							.limit(1);

						const lastMessage = lastMsgs?.[0] || null;

						// Unread count
						const lastRead = lastReadMap.get(ch.id);
						let unreadCount = 0;
						if (lastRead) {
							const { count } = await supabase
								.from('chat_messages')
								.select('id', { count: 'exact', head: true })
								.eq('channel_id', ch.id)
								.is('parent_id', null)
								.neq('user_id', userId)
								.gt('created_at', lastRead);
							unreadCount = count || 0;
						}

						return {
							...ch,
							last_message: lastMessage,
							unread_count: unreadCount,
						};
					})
				);

				return { data: enriched };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		providesTags: (_result, _error, userId) => [{ type: 'ChatChannelList' as const, id: userId }],
	}),

	getChannelMessages: builder.query<
		ChatMessage[],
		{ channelId: string; limit?: number; before?: string }
	>({
		async queryFn({ channelId, limit = 50, before }) {
			try {
				const supabase = getSupabase();

				let query = supabase
					.from('chat_messages')
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image),
						reactions:chat_reactions(*),
						attachments:chat_attachments(*)
					`
					)
					.eq('channel_id', channelId)
					.is('parent_id', null)
					.order('created_at', { ascending: true })
					.limit(limit);

				if (before) {
					query = query.lt('created_at', before);
				}

				const { data, error } = await query;
				if (error) throw error;

				// Add reply_count for each message
				const messages: ChatMessage[] = await Promise.all(
					(data || []).map(async (msg) => {
						const { count } = await supabase
							.from('chat_messages')
							.select('id', { count: 'exact', head: true })
							.eq('parent_id', msg.id);

						return { ...msg, reply_count: count || 0 };
					})
				);

				return { data: messages };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		providesTags: (_result, _error, { channelId }) => [{ type: 'ChatMessages' as const, id: channelId }],
	}),

	getThreadMessages: builder.query<ChatMessage[], { parentId: string }>({
		async queryFn({ parentId }) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_messages')
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image),
						reactions:chat_reactions(*),
						attachments:chat_attachments(*)
					`
					)
					.eq('parent_id', parentId)
					.order('created_at', { ascending: true });

				if (error) throw error;
				return { data: data || [] };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		providesTags: (_result, _error, { parentId }) => [{ type: 'ChatMessages' as const, id: `thread-${parentId}` }],
	}),

	getChannelMembers: builder.query<ChatChannelMember[], string>({
		async queryFn(channelId) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_channel_members')
					.select(
						`
						*,
						user:users(id, name, email, image, custom_name, custom_image)
					`
					)
					.eq('channel_id', channelId);

				if (error) throw error;
				return { data: data || [] };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		providesTags: (_result, _error, channelId) => [{ type: 'ChatMembers' as const, id: channelId }],
	}),

	// ─── Mutations ───

	createDmChannel: builder.mutation<
		ChatChannel,
		{ currentUserId: string; otherUserId: string }
	>({
		async queryFn({ currentUserId, otherUserId }) {
			try {
				const supabase = getSupabase();

				// Find existing DM between these two users
				const { data: myChannels } = await supabase
					.from('chat_channel_members')
					.select('channel_id')
					.eq('user_id', currentUserId);

				const { data: theirChannels } = await supabase
					.from('chat_channel_members')
					.select('channel_id')
					.eq('user_id', otherUserId);

				const myIds = new Set((myChannels || []).map((c) => c.channel_id));
				const sharedIds = (theirChannels || []).filter((c) => myIds.has(c.channel_id)).map((c) => c.channel_id);

				if (sharedIds.length > 0) {
					// Check if any shared channel is a DM
					const { data: existingDm } = await supabase
						.from('chat_channels')
						.select('*')
						.in('id', sharedIds)
						.eq('type', 'dm')
						.limit(1)
						.single();

					if (existingDm) {
						return { data: existingDm };
					}
				}

				// Create new DM channel
				const { data: channel, error: chErr } = await supabase
					.from('chat_channels')
					.insert({ type: 'dm', created_by: currentUserId })
					.select()
					.single();

				if (chErr || !channel) throw chErr || new Error('Failed to create DM channel');

				// Add both users as members
				const { error: memErr } = await supabase.from('chat_channel_members').insert([
					{ channel_id: channel.id, user_id: currentUserId, role: 'admin' },
					{ channel_id: channel.id, user_id: otherUserId, role: 'member' },
				]);

				if (memErr) throw memErr;

				return { data: channel };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { currentUserId }) => [
			{ type: 'ChatChannelList' as const, id: currentUserId },
		],
	}),

	createGroupChannel: builder.mutation<
		ChatChannel,
		{ name: string; description?: string; memberIds: string[]; createdBy: string }
	>({
		async queryFn({ name, description, memberIds, createdBy }) {
			try {
				const supabase = getSupabase();

				const { data: channel, error: chErr } = await supabase
					.from('chat_channels')
					.insert({ name, description, type: 'group', created_by: createdBy })
					.select()
					.single();

				if (chErr || !channel) throw chErr || new Error('Failed to create group channel');

				// Add creator as admin + members
				const allMembers = [
					{ channel_id: channel.id, user_id: createdBy, role: 'admin' as const },
					...memberIds
						.filter((id) => id !== createdBy)
						.map((id) => ({ channel_id: channel.id, user_id: id, role: 'member' as const })),
				];

				const { error: memErr } = await supabase.from('chat_channel_members').insert(allMembers);
				if (memErr) throw memErr;

				return { data: channel };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { createdBy }) => [
			{ type: 'ChatChannelList' as const, id: createdBy },
		],
	}),

	sendMessage: builder.mutation<
		ChatMessage,
		{ channelId: string; userId: string; content: string; parentId?: string }
	>({
		async queryFn({ channelId, userId, content, parentId }) {
			try {
				const supabase = getSupabase();

				const { data: message, error: msgErr } = await supabase
					.from('chat_messages')
					.insert({
						channel_id: channelId,
						user_id: userId,
						content,
						parent_id: parentId || null,
					})
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image)
					`
					)
					.single();

					if (msgErr || !message) throw msgErr || new Error('Failed to send message');

				// Update channel.updated_at
				await supabase
					.from('chat_channels')
					.update({ updated_at: new Date().toISOString() })
					.eq('id', channelId);

				// Update sender's last_read_at
				await supabase
					.from('chat_channel_members')
					.update({ last_read_at: new Date().toISOString() })
					.eq('channel_id', channelId)
					.eq('user_id', userId);

				// Fire-and-forget push notifications to other channel members
				const senderName = message.user?.custom_name || message.user?.name || 'Ktoś';
				const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;

				supabase
					.from('chat_channel_members')
					.select('user_id')
					.eq('channel_id', channelId)
					.neq('user_id', userId)
					.then(({ data: members }) => {
						members?.forEach((m) => {
							triggerPushNotification({
								userId: m.user_id,
								title: senderName,
								body: preview,
								url: `/chat?channel=${channelId}`,
								tag: `chat-${channelId}`,
								type: 'chat',
							});
						});
					});

				return { data: { ...message, reactions: [], attachments: [], reply_count: 0 } };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId, parentId, userId }) => {
			const tags: Array<{ type: string; id: string }> = [
				{ type: 'ChatChannelList', id: userId },
			];
			if (parentId) {
				tags.push({ type: 'ChatMessages', id: `thread-${parentId}` });
			} else {
				tags.push({ type: 'ChatMessages', id: channelId });
			}
			return tags;
		},
	}),

	editMessage: builder.mutation<
		ChatMessage,
		{ messageId: string; content: string; channelId: string; parentId?: string | null }
	>({
		async queryFn({ messageId, content }) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_messages')
					.update({ content, is_edited: true, updated_at: new Date().toISOString() })
					.eq('id', messageId)
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image)
					`
					)
					.single();

				if (error || !data) throw error || new Error('Failed to edit message');
				return { data };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId, parentId }) => {
			if (parentId) {
				return [{ type: 'ChatMessages' as const, id: `thread-${parentId}` }];
			}
			return [{ type: 'ChatMessages' as const, id: channelId }];
		},
	}),

	deleteMessage: builder.mutation<
		{ messageId: string },
		{ messageId: string; channelId: string; parentId?: string | null }
	>({
		async queryFn({ messageId }) {
			try {
				const supabase = getSupabase();

				const { error } = await supabase
					.from('chat_messages')
					.update({
						content: '',
						is_deleted: true,
						updated_at: new Date().toISOString(),
					})
					.eq('id', messageId);

				if (error) throw error;
				return { data: { messageId } };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId, parentId }) => {
			if (parentId) {
				return [{ type: 'ChatMessages' as const, id: `thread-${parentId}` }];
			}
			return [{ type: 'ChatMessages' as const, id: channelId }];
		},
	}),

	toggleReaction: builder.mutation<
		{ added: boolean },
		{ messageId: string; userId: string; emoji: string; channelId: string; parentId?: string | null }
	>({
		async queryFn({ messageId, userId, emoji }) {
			try {
				const supabase = getSupabase();

				// Check if reaction exists
				const { data: existing } = await supabase
					.from('chat_reactions')
					.select('id')
					.eq('message_id', messageId)
					.eq('user_id', userId)
					.eq('emoji', emoji)
					.maybeSingle();

				if (existing) {
					// Remove
					await supabase.from('chat_reactions').delete().eq('id', existing.id);
					return { data: { added: false } };
				} else {
					// Add
					await supabase.from('chat_reactions').insert({ message_id: messageId, user_id: userId, emoji });
					return { data: { added: true } };
				}
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId, parentId }) => {
			if (parentId) {
				return [{ type: 'ChatMessages' as const, id: `thread-${parentId}` }];
			}
			return [{ type: 'ChatMessages' as const, id: channelId }];
		},
	}),

	markChannelRead: builder.mutation<{ success: boolean }, { channelId: string; userId: string }>({
		async queryFn({ channelId, userId }) {
			try {
				const supabase = getSupabase();

				const { error } = await supabase
					.from('chat_channel_members')
					.update({ last_read_at: new Date().toISOString() })
					.eq('channel_id', channelId)
					.eq('user_id', userId);

				if (error) throw error;
				return { data: { success: true } };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { userId }) => [
			{ type: 'ChatChannelList' as const, id: userId },
		],
	}),

	addChannelMember: builder.mutation<
		ChatChannelMember,
		{ channelId: string; userId: string; currentUserId: string }
	>({
		async queryFn({ channelId, userId }) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_channel_members')
					.insert({ channel_id: channelId, user_id: userId, role: 'member' })
					.select(
						`
						*,
						user:users(id, name, email, image, custom_name, custom_image)
					`
					)
					.single();

				if (error || !data) throw error || new Error('Failed to add member');
				return { data };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId, currentUserId }) => [
			{ type: 'ChatMembers' as const, id: channelId },
			{ type: 'ChatChannelList' as const, id: currentUserId },
		],
	}),

	removeChannelMember: builder.mutation<
		{ userId: string },
		{ channelId: string; userId: string; currentUserId: string }
	>({
		async queryFn({ channelId, userId }) {
			try {
				const supabase = getSupabase();

				const { error } = await supabase
					.from('chat_channel_members')
					.delete()
					.eq('channel_id', channelId)
					.eq('user_id', userId);

				if (error) throw error;
				return { data: { userId } };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId, currentUserId }) => [
			{ type: 'ChatMembers' as const, id: channelId },
			{ type: 'ChatChannelList' as const, id: currentUserId },
		],
	}),

	// ─── Management Endpoints ───

	renameChannel: builder.mutation<
		ChatChannel,
		{ channelId: string; name: string; currentUserId: string }
	>({
		async queryFn({ channelId, name }) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_channels')
					.update({ name, updated_at: new Date().toISOString() })
					.eq('id', channelId)
					.select()
					.single();

				if (error || !data) throw error || new Error('Failed to rename channel');
				return { data };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { currentUserId }) => [
			{ type: 'ChatChannelList' as const, id: currentUserId },
		],
	}),

	pinMessage: builder.mutation<
		ChatMessage,
		{ messageId: string; userId: string; channelId: string }
	>({
		async queryFn({ messageId, userId }) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_messages')
					.update({
						is_pinned: true,
						pinned_by: userId,
						pinned_at: new Date().toISOString(),
					})
					.eq('id', messageId)
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image)
					`
					)
					.single();

				if (error || !data) throw error || new Error('Failed to pin message');
				return { data };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId }) => [
			{ type: 'ChatMessages' as const, id: channelId },
			{ type: 'ChatMessages' as const, id: `pinned-${channelId}` },
		],
	}),

	unpinMessage: builder.mutation<
		ChatMessage,
		{ messageId: string; channelId: string }
	>({
		async queryFn({ messageId }) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_messages')
					.update({
						is_pinned: false,
						pinned_by: null,
						pinned_at: null,
					})
					.eq('id', messageId)
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image)
					`
					)
					.single();

				if (error || !data) throw error || new Error('Failed to unpin message');
				return { data };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		invalidatesTags: (_result, _error, { channelId }) => [
			{ type: 'ChatMessages' as const, id: channelId },
			{ type: 'ChatMessages' as const, id: `pinned-${channelId}` },
		],
	}),

	getPinnedMessages: builder.query<ChatMessage[], string>({
		async queryFn(channelId) {
			try {
				const supabase = getSupabase();

				const { data, error } = await supabase
					.from('chat_messages')
					.select(
						`
						*,
						user:users!chat_messages_user_id_fkey(id, name, email, image, custom_name, custom_image)
					`
					)
					.eq('channel_id', channelId)
					.eq('is_pinned', true)
					.order('pinned_at', { ascending: false });

				if (error) throw error;
				return { data: data || [] };
			} catch (err) {
				const error = err as Error;
				return { error: { status: 'CUSTOM_ERROR', error: error.message } };
			}
		},
		providesTags: (_result, _error, channelId) => [{ type: 'ChatMessages' as const, id: `pinned-${channelId}` }],
	}),
});

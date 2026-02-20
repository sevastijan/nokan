'use client';

import { useChat } from '@/app/context/ChatContext';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useGetChannelMessagesQuery, useGetChannelMembersQuery, useGetUserChannelsQuery, useSendMessageMutation, useMarkChannelReadMutation } from '@/app/store/apiSlice';
import { useEffect, useRef, useCallback } from 'react';
import ChannelHeader from './ChannelHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { useTypingIndicator } from '@/app/hooks/chat/useTypingIndicator';
import { useRealtimeMessages } from '@/app/hooks/chat/useRealtimeMessages';
import { useChatNotification } from '@/app/hooks/chat/useChatNotification';
import { useDisplayUser } from '@/app/hooks/useDisplayUser';

const POLL_INTERVAL = 5000;

const ChannelView = () => {
	const { selectedChannelId } = useChat();
	const { currentUser } = useCurrentUser();
	const { displayName } = useDisplayUser();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const prevMsgCountRef = useRef(0);
	const initialScrollRef = useRef(true);

	const { sendTyping } = useTypingIndicator(selectedChannelId ?? '', currentUser?.id ?? '');
	const { broadcastNewMessage, broadcastMessageUpdate, broadcastReactionUpdate } = useRealtimeMessages(selectedChannelId, currentUser?.id ?? '');

	const { data: messages = [], isLoading, refetch } = useGetChannelMessagesQuery(
		{ channelId: selectedChannelId! },
		{ skip: !selectedChannelId }
	);

	const { data: members = [] } = useGetChannelMembersQuery(selectedChannelId!, {
		skip: !selectedChannelId,
	});

	const { data: channels = [] } = useGetUserChannelsQuery(currentUser?.id ?? '', {
		skip: !currentUser?.id,
	});
	const currentChannel = channels.find((ch) => ch.id === selectedChannelId);
	const isAdmin = members.some((m) => m.user_id === currentUser?.id && m.role === 'admin');

	const [sendMessage] = useSendMessageMutation();
	const [markRead] = useMarkChannelReadMutation();

	// Browser tab + push notification for new messages
	useChatNotification(messages, currentUser?.id ?? '', !!selectedChannelId);

	// Poll for new messages
	useEffect(() => {
		if (!selectedChannelId) return;
		const interval = setInterval(() => { refetch(); }, POLL_INTERVAL);
		return () => clearInterval(interval);
	}, [selectedChannelId, refetch]);

	// Mark channel as read when opening and when new messages arrive
	useEffect(() => {
		if (selectedChannelId && currentUser?.id) {
			markRead({ channelId: selectedChannelId, userId: currentUser.id });
		}
	}, [selectedChannelId, currentUser?.id, markRead, messages.length]);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		if (messages.length > prevMsgCountRef.current) {
			const isInitial = initialScrollRef.current;
			initialScrollRef.current = false;

			// Double-rAF ensures CSS/layout is fully computed before scrolling
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const el = scrollContainerRef.current;
					if (!el) return;
					if (isInitial) {
						el.scrollTop = el.scrollHeight;
					} else {
						el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
					}
				});
			});
		}
		prevMsgCountRef.current = messages.length;
	}, [messages.length]);

	const handleSend = useCallback(
		async (content: string) => {
			if (!selectedChannelId || !currentUser?.id || !content.trim()) return;
			await sendMessage({
				channelId: selectedChannelId,
				userId: currentUser.id,
				content: content.trim(),
			});
			broadcastNewMessage();
		},
		[selectedChannelId, currentUser?.id, sendMessage, broadcastNewMessage]
	);

	if (!selectedChannelId) return null;

	return (
		<div className="flex flex-col h-screen bg-slate-900">
			<ChannelHeader members={members} currentUserId={currentUser?.id ?? ''} channel={currentChannel ?? null} />

			{/* Messages — justify-end pins messages to bottom like Slack */}
			<div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
				<div className="flex flex-col justify-end min-h-full">
					<div className="px-4 py-3">
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
							</div>
						) : (
							<MessageList messages={messages} currentUserId={currentUser?.id ?? ''} isAdmin={isAdmin} onMessageUpdate={broadcastMessageUpdate} onReactionUpdate={broadcastReactionUpdate} />
						)}
					</div>
				</div>
			</div>

			<TypingIndicator channelId={selectedChannelId} currentUserId={currentUser?.id ?? ''} />
			<MessageInput
				onSend={handleSend}
				channelId={selectedChannelId}
				currentUserId={currentUser?.id ?? ''}
				onTyping={() => sendTyping(displayName)}
			/>
		</div>
	);
};

export default ChannelView;

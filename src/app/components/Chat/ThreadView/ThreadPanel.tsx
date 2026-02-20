'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '@/app/context/ChatContext';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useGetThreadMessagesQuery, useGetChannelMessagesQuery, useSendMessageMutation } from '@/app/store/apiSlice';
import MessageList from '../ChannelView/MessageList';
import MessageInput from '../ChannelView/MessageInput';
import MessageItem from '../ChannelView/MessageItem';
import { getUserDisplayName } from '../utils';
import { useRealtimeMessages } from '@/app/hooks/chat/useRealtimeMessages';

const ThreadPanel = () => {
	const { t } = useTranslation();
	const { threadParentId, selectedChannelId, closeThread } = useChat();
	const { currentUser } = useCurrentUser();
	const bottomRef = useRef<HTMLDivElement>(null);
	const { broadcastNewMessage, broadcastMessageUpdate, broadcastReactionUpdate } = useRealtimeMessages(
		threadParentId ? `thread:${threadParentId}` : null,
		currentUser?.id ?? ''
	);

	const { data: threadMessages = [], isLoading } = useGetThreadMessagesQuery(
		{ parentId: threadParentId! },
		{ skip: !threadParentId }
	);

	const { data: channelMessages = [] } = useGetChannelMessagesQuery(
		{ channelId: selectedChannelId! },
		{ skip: !selectedChannelId }
	);

	const parentMessage = channelMessages.find((m) => m.id === threadParentId);

	const [sendMessage] = useSendMessageMutation();

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [threadMessages.length]);

	const handleSend = useCallback(
		async (content: string) => {
			if (!selectedChannelId || !currentUser?.id || !threadParentId || !content.trim()) return;
			await sendMessage({
				channelId: selectedChannelId,
				userId: currentUser.id,
				content: content.trim(),
				parentId: threadParentId,
			});
			broadcastNewMessage();
		},
		[selectedChannelId, currentUser?.id, threadParentId, sendMessage, broadcastNewMessage]
	);

	if (!threadParentId || !selectedChannelId) return null;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/80">
				<button
					onClick={closeThread}
					className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
				>
					<ArrowLeft className="w-4 h-4" />
				</button>
				<div className="flex items-center gap-2">
					<MessageSquare className="w-4 h-4 text-brand-400" />
					<h3 className="text-sm font-semibold text-white">{t('chat.thread')}</h3>
					<span className="text-xs text-slate-500">
						{threadMessages.length} {t('chat.reply', { count: threadMessages.length })}
					</span>
				</div>
			</div>

			{/* Parent message */}
			{parentMessage && (
				<div className="px-4 py-3 border-b border-slate-800/50 bg-slate-800/20">
					<MessageItem
						message={parentMessage}
						currentUserId={currentUser?.id ?? ''}
						isThreadParent
						onMessageUpdate={broadcastMessageUpdate}
						onReactionUpdate={broadcastReactionUpdate}
					/>
				</div>
			)}

			{/* Thread messages */}
			<div className="flex-1 overflow-y-auto px-4 py-3">
				{isLoading ? (
					<div className="flex items-center justify-center h-full">
						<div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
					</div>
				) : threadMessages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center">
						<MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
						<p className="text-sm text-slate-500">{t('chat.noReplies')}</p>
						<p className="text-xs text-slate-600 mt-1">{t('chat.startDiscussion')}</p>
					</div>
				) : (
					<MessageList messages={threadMessages} currentUserId={currentUser?.id ?? ''} isThread onMessageUpdate={broadcastMessageUpdate} onReactionUpdate={broadcastReactionUpdate} />
				)}
				<div ref={bottomRef} />
			</div>

			<MessageInput
				onSend={handleSend}
				channelId={selectedChannelId}
				currentUserId={currentUser?.id ?? ''}
				placeholder={t('chat.replyInThread')}
			/>
		</div>
	);
};

export default ThreadPanel;

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X, Minus, Maximize2, Expand } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/app/context/ChatContext';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useGetChannelMessagesQuery, useGetChannelMembersQuery, useGetUserChannelsQuery, useSendMessageMutation, useMarkChannelReadMutation } from '@/app/store/apiSlice';
import Avatar from '@/app/components/Avatar/Avatar';
import OnlineIndicator from './OnlineIndicator';
import { getUserDisplayName, getUserDisplayAvatar, formatMessageTime } from './utils';
import { useTypingIndicator } from '@/app/hooks/chat/useTypingIndicator';
import { useRealtimeMessages } from '@/app/hooks/chat/useRealtimeMessages';
import { useDisplayUser } from '@/app/hooks/useDisplayUser';

const POLL_INTERVAL = 5000;

interface MiniChatProps {
	channelId: string;
	minimized: boolean;
	style?: React.CSSProperties;
}

const MiniChat = ({ channelId, minimized, style }: MiniChatProps) => {
	const { closeMiniChat, toggleMinimizeMiniChat, selectChannel, onlineUserIds } = useChat();
	const router = useRouter();
	const { currentUser } = useCurrentUser();
	const { displayName: myName } = useDisplayUser();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const prevCountRef = useRef(0);
	const initialScrollRef = useRef(true);

	const { sendTyping, typingUsers } = useTypingIndicator(channelId, currentUser?.id ?? '');
	const { broadcastNewMessage } = useRealtimeMessages(channelId, currentUser?.id ?? '');

	const { data: messages = [], isLoading, refetch } = useGetChannelMessagesQuery(
		{ channelId },
		{ skip: !channelId }
	);

	const { data: members = [] } = useGetChannelMembersQuery(channelId, { skip: !channelId });

	const { data: channels = [] } = useGetUserChannelsQuery(currentUser?.id ?? '', {
		skip: !currentUser?.id,
	});
	const channel = channels.find((ch) => ch.id === channelId);

	const [sendMessage] = useSendMessageMutation();
	const [markRead] = useMarkChannelReadMutation();

	const isDm = channel?.type === 'dm';
	const otherMember = isDm ? members.find((m) => m.user_id !== currentUser?.id) : null;
	const headerName = isDm ? getUserDisplayName(otherMember?.user) : channel?.name || 'Kanał';
	const headerAvatar = isDm ? getUserDisplayAvatar(otherMember?.user) : '';

	// Poll
	useEffect(() => {
		if (minimized) return;
		const interval = setInterval(() => refetch(), POLL_INTERVAL);
		return () => clearInterval(interval);
	}, [channelId, minimized, refetch]);

	// Mark read
	useEffect(() => {
		if (!minimized && currentUser?.id) {
			markRead({ channelId, userId: currentUser.id });
		}
	}, [channelId, currentUser?.id, markRead, minimized]);

	// Scroll on new messages
	useEffect(() => {
		if (messages.length > prevCountRef.current && !minimized) {
			const isInitial = initialScrollRef.current;
			initialScrollRef.current = false;

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
		prevCountRef.current = messages.length;
	}, [messages.length, minimized]);

	const handleSend = useCallback(async () => {
		const value = inputRef.current?.value.trim();
		if (!value || !currentUser?.id) return;
		inputRef.current!.value = '';
		await sendMessage({ channelId, userId: currentUser.id, content: value });
		broadcastNewMessage();
	}, [channelId, currentUser?.id, sendMessage, broadcastNewMessage]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div
			className="flex flex-col bg-slate-900 border border-slate-700/60 rounded-t-xl shadow-2xl shadow-black/40 overflow-hidden w-[320px] max-w-[calc(100vw-2rem)]"
			style={{ height: minimized ? 48 : 420, ...style }}
		>
			{/* Header */}
			<div
				className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/80 border-b border-slate-700/40 shrink-0 cursor-pointer select-none"
				onClick={() => toggleMinimizeMiniChat(channelId)}
			>
				{isDm ? (
					<div className="relative shrink-0">
						<Avatar src={headerAvatar} alt={headerName} size={24} />
						<OnlineIndicator isOnline={otherMember?.user_id ? onlineUserIds.includes(otherMember.user_id) : false} className="absolute -bottom-0.5 -right-0.5" />
					</div>
				) : (
					<div className="w-6 h-6 rounded bg-blue-600/20 flex items-center justify-center shrink-0">
						<span className="text-[10px] font-bold text-blue-400">#</span>
					</div>
				)}
				<span className="text-sm font-semibold text-white truncate flex-1">{headerName}</span>
				<div className="flex items-center gap-0.5">
					<button
						onClick={(e) => {
							e.stopPropagation();
							selectChannel(channelId);
							router.push(`/chat?channel=${channelId}`);
							closeMiniChat(channelId);
						}}
						className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
						title="Otwórz pełny czat"
					>
						<Expand className="w-3.5 h-3.5" />
					</button>
					<button
						onClick={(e) => { e.stopPropagation(); toggleMinimizeMiniChat(channelId); }}
						className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
					>
						{minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
					</button>
					<button
						onClick={(e) => { e.stopPropagation(); closeMiniChat(channelId); }}
						className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			{/* Body (hidden when minimized) */}
			{!minimized && (
				<>
					{/* Messages */}
					<div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
						<div className="flex flex-col justify-end min-h-full px-3 py-2">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
								</div>
							) : messages.length === 0 ? (
								<p className="text-center text-xs text-slate-600 py-8">Rozpocznij rozmowę</p>
							) : (
								<div className="space-y-1">
									{messages.map((msg) => {
										const isOwn = msg.user_id === currentUser?.id;
										const senderName = getUserDisplayName(msg.user);
										const senderAvatar = getUserDisplayAvatar(msg.user);

										return (
											<div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
												{!isOwn && <Avatar src={senderAvatar} alt={senderName} size={24} className="shrink-0 mt-0.5" />}
												<div className={`max-w-[75%] ${isOwn ? 'ml-auto' : ''}`}>
													<div
														className={`px-3 py-1.5 rounded-2xl text-sm ${
															isOwn
																? 'bg-blue-600 text-white rounded-br-sm'
																: 'bg-slate-800 text-slate-200 rounded-bl-sm'
														}`}
													>
														{msg.is_deleted ? (
															<span className="italic text-slate-500 text-xs">[Usunięta]</span>
														) : (
															msg.content
														)}
													</div>
													<span className={`text-[10px] text-slate-600 mt-0.5 block ${isOwn ? 'text-right' : ''}`}>
														{formatMessageTime(msg.created_at)}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>

					{/* Typing indicator */}
					{typingUsers.length > 0 && (
						<div className="shrink-0 px-3 py-1">
							<div className="flex items-center gap-1.5">
								<div className="flex gap-0.5">
									<span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
									<span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
									<span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
								</div>
								<span className="text-[10px] text-slate-500">
									{typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'pisze' : 'piszą'}...
								</span>
							</div>
						</div>
					)}

					{/* Input */}
					<div className="shrink-0 px-2 py-2 border-t border-slate-800/60">
						<input
							ref={inputRef}
							type="text"
							placeholder="Aa..."
							onKeyDown={handleKeyDown}
							onChange={() => sendTyping(myName)}
							className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-full text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40"
						/>
					</div>
				</>
			)}
		</div>
	);
};

export default MiniChat;

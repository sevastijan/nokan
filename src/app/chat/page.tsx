'use client';

import { useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/app/context/ChatContext';
import ChannelView from '@/app/components/Chat/ChannelView/ChannelView';
import ThreadPanel from '@/app/components/Chat/ThreadView/ThreadPanel';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
	const searchParams = useSearchParams();
	const { selectedChannelId, selectChannel, threadParentId } = useChat();
	const channelFromUrl = searchParams.get('channel');

	// URL is the source of truth — sync to Redux before paint so ChannelView sees the ID immediately
	useLayoutEffect(() => {
		if (channelFromUrl && channelFromUrl !== selectedChannelId) {
			selectChannel(channelFromUrl);
		}
	}, [channelFromUrl, selectChannel, selectedChannelId]);

	// Use URL param directly (available immediately) with Redux as fallback
	const activeChannelId = channelFromUrl || selectedChannelId;

	return (
		<div className="flex flex-col h-screen bg-slate-950">
			{activeChannelId ? (
				threadParentId ? (
					<ThreadPanel />
				) : (
					<ChannelView />
				)
			) : (
				<div className="flex-1 flex flex-col items-center justify-center text-center px-6">
					<div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
						<MessageCircle className="w-8 h-8 text-slate-600" />
					</div>
					<h2 className="text-lg font-semibold text-white mb-1">Chat</h2>
					<p className="text-sm text-slate-500 max-w-sm">
						Wybierz kanał lub rozmowę z panelu bocznego
					</p>
				</div>
			)}
		</div>
	);
}

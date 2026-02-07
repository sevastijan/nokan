'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/app/context/ChatContext';
import ChannelView from '@/app/components/Chat/ChannelView/ChannelView';
import ThreadPanel from '@/app/components/Chat/ThreadView/ThreadPanel';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
	const searchParams = useSearchParams();
	const { selectedChannelId, selectChannel, threadParentId } = useChat();

	// Sync URL param → context on mount
	useEffect(() => {
		const channelFromUrl = searchParams.get('channel');
		if (channelFromUrl && channelFromUrl !== selectedChannelId) {
			selectChannel(channelFromUrl);
		}
	}, [searchParams, selectChannel, selectedChannelId]);

	return (
		<div className="flex flex-col h-screen bg-slate-950">
			{selectedChannelId ? (
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

'use client';

import { useChat } from '@/app/context/ChatContext';
import MiniChat from './MiniChat';

const MiniChatContainer = () => {
	const { miniChats } = useChat();

	if (miniChats.length === 0) return null;

	return (
		<div className="fixed bottom-4 right-4 z-[9999] flex items-end gap-3 pointer-events-none">
			{miniChats.map((mc, index) => (
				<div key={mc.channelId} className="pointer-events-auto">
					<MiniChat
						channelId={mc.channelId}
						minimized={mc.minimized}
					/>
				</div>
			))}
		</div>
	);
};

export default MiniChatContainer;

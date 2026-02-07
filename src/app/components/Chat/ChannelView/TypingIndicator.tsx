'use client';

import { useTypingIndicator } from '@/app/hooks/chat/useTypingIndicator';

interface TypingIndicatorProps {
	channelId: string;
	currentUserId: string;
}

const TypingIndicator = ({ channelId, currentUserId }: TypingIndicatorProps) => {
	const { typingUsers } = useTypingIndicator(channelId, currentUserId);

	if (typingUsers.length === 0) return null;

	const names = typingUsers.map((u) => u.userName).join(', ');

	return (
		<div className="px-4 py-1.5 shrink-0">
			<div className="flex items-center gap-2">
				<div className="flex gap-0.5">
					<span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
					<span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
					<span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
				</div>
				<span className="text-xs text-slate-500">
					{names} {typingUsers.length === 1 ? 'pisze' : 'piszą'}...
				</span>
			</div>
		</div>
	);
};

export default TypingIndicator;

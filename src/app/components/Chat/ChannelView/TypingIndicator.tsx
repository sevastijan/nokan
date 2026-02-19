'use client';

import { useTranslation } from 'react-i18next';
import { useTypingIndicator } from '@/app/hooks/chat/useTypingIndicator';

interface TypingIndicatorProps {
	channelId: string;
	currentUserId: string;
}

const TypingIndicator = ({ channelId, currentUserId }: TypingIndicatorProps) => {
	const { t } = useTranslation();
	const { typingUsers } = useTypingIndicator(channelId, currentUserId);

	if (typingUsers.length === 0) return null;

	const names = typingUsers.map((u) => u.userName).join(', ');

	return (
		<div className="px-4 py-1.5 shrink-0">
			<div className="flex items-center gap-2">
				<div className="flex gap-0.5">
					<span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
					<span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
					<span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
				</div>
				<span className="text-xs text-slate-500">
					{names} {t('chat.typing', { count: typingUsers.length })}
				</span>
			</div>
		</div>
	);
};

export default TypingIndicator;

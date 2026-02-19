'use client';

import { useTranslation } from 'react-i18next';
import { ChatMessage } from '@/app/store/endpoints/chatEndpoints';
import MessageItem from './MessageItem';
import { formatDateSeparator } from '../utils';

interface MessageListProps {
	messages: ChatMessage[];
	currentUserId: string;
	isThread?: boolean;
	isAdmin?: boolean;
	onMessageUpdate?: () => void;
	onReactionUpdate?: () => void;
}

const MessageList = ({ messages, currentUserId, isThread = false, isAdmin = false, onMessageUpdate, onReactionUpdate }: MessageListProps) => {
	const { t } = useTranslation();

	if (messages.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center py-12">
				<p className="text-sm text-slate-500">{t('chat.noMessages')}</p>
				<p className="text-xs text-slate-600 mt-1">{t('chat.writeFirst')}</p>
			</div>
		);
	}

	// Group messages by date for separators
	let lastDate = '';

	return (
		<div className="space-y-0.5">
			{messages.map((msg, idx) => {
				const msgDate = new Date(msg.created_at).toDateString();
				const showDateSeparator = !isThread && msgDate !== lastDate;
				lastDate = msgDate;

				// Group consecutive messages from same author (within 5 min)
				const prevMsg = idx > 0 ? messages[idx - 1] : null;
				const isGrouped =
					prevMsg &&
					prevMsg.user_id === msg.user_id &&
					new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000 &&
					msgDate === new Date(prevMsg.created_at).toDateString();

				return (
					<div key={msg.id}>
						{showDateSeparator && (
							<div className="flex items-center gap-3 py-3">
								<div className="flex-1 h-px bg-slate-800" />
								<span className="text-[11px] font-medium text-slate-500 shrink-0">
									{formatDateSeparator(msg.created_at)}
								</span>
								<div className="flex-1 h-px bg-slate-800" />
							</div>
						)}
						<MessageItem
							message={msg}
							currentUserId={currentUserId}
							isGrouped={!!isGrouped}
							isAdmin={isAdmin}
							onMessageUpdate={onMessageUpdate}
							onReactionUpdate={onReactionUpdate}
						/>
					</div>
				);
			})}
		</div>
	);
};

export default MessageList;

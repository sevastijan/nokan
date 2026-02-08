'use client';

import { useState } from 'react';
import { MessageSquare, Trash2, Pencil, SmilePlus, Pin } from 'lucide-react';
import Avatar from '@/app/components/Avatar/Avatar';
import { ChatMessage } from '@/app/store/endpoints/chatEndpoints';
import { useChat } from '@/app/context/ChatContext';
import { useEditMessageMutation, useDeleteMessageMutation, useToggleReactionMutation, usePinMessageMutation, useUnpinMessageMutation } from '@/app/store/apiSlice';
import { formatMessageTime, getUserDisplayName, getUserDisplayAvatar } from '../utils';
import ReactionBar from './ReactionBar';
import EmojiPicker from './EmojiPicker';
import AttachmentPreview from './AttachmentPreview';
import LinkifyText from '../LinkifyText';

interface MessageItemProps {
	message: ChatMessage;
	currentUserId: string;
	isGrouped?: boolean;
	isThreadParent?: boolean;
	isAdmin?: boolean;
	onMessageUpdate?: () => void;
	onReactionUpdate?: () => void;
}

const MessageItem = ({ message, currentUserId, isGrouped = false, isThreadParent = false, isAdmin = false, onMessageUpdate, onReactionUpdate }: MessageItemProps) => {
	const { openThread, selectedChannelId } = useChat();
	const [isHovered, setIsHovered] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const [editMessage] = useEditMessageMutation();
	const [deleteMessage] = useDeleteMessageMutation();
	const [toggleReaction] = useToggleReactionMutation();
	const [pinMessage] = usePinMessageMutation();
	const [unpinMessage] = useUnpinMessageMutation();

	const isOwn = message.user_id === currentUserId;
	const displayName = getUserDisplayName(message.user);
	const displayAvatar = getUserDisplayAvatar(message.user);

	const handleEdit = async () => {
		if (!editContent.trim() || editContent === message.content) {
			setIsEditing(false);
			return;
		}
		await editMessage({
			messageId: message.id,
			content: editContent.trim(),
			channelId: message.channel_id,
			parentId: message.parent_id,
		});
		onMessageUpdate?.();
		setIsEditing(false);
	};

	const handleDelete = async () => {
		await deleteMessage({
			messageId: message.id,
			channelId: message.channel_id,
			parentId: message.parent_id,
		});
		onMessageUpdate?.();
	};

	const handleReaction = async (emoji: string) => {
		if (!selectedChannelId) return;
		await toggleReaction({
			messageId: message.id,
			userId: currentUserId,
			emoji,
			channelId: selectedChannelId,
			parentId: message.parent_id,
		});
		onReactionUpdate?.();
		setShowEmojiPicker(false);
	};

	const handleTogglePin = async () => {
		if (!selectedChannelId) return;
		if (message.is_pinned) {
			await unpinMessage({ messageId: message.id, channelId: selectedChannelId });
		} else {
			await pinMessage({ messageId: message.id, userId: currentUserId, channelId: selectedChannelId });
		}
	};

	const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleEdit();
		}
		if (e.key === 'Escape') {
			setIsEditing(false);
			setEditContent(message.content);
		}
	};

	if (message.is_deleted) {
		return (
			<div className={`flex items-start gap-3 px-2 py-1 ${isGrouped ? 'pl-[52px]' : ''}`}>
				{!isGrouped && <div className="w-8 h-8 shrink-0" />}
				<p className="text-sm text-slate-600 italic">[Wiadomość usunięta]</p>
			</div>
		);
	}

	return (
		<div
			className={`group relative flex items-start gap-3 px-3 rounded-lg transition-colors ${
				isGrouped ? 'pl-[56px] py-0.5' : 'py-2'
			} ${isHovered ? 'bg-slate-800/20' : 'hover:bg-slate-800/10'} ${
				message.is_pinned ? 'border-l-2 border-amber-500/30' : ''
			}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => { setIsHovered(false); setShowEmojiPicker(false); }}
		>
			{/* Avatar (only for first message in group) */}
			{!isGrouped && (
				<Avatar src={displayAvatar} alt={displayName} size={36} className="shrink-0 mt-0.5" />
			)}

			{/* Content */}
			<div className="flex-1 min-w-0">
				{!isGrouped && (
					<div className="flex items-baseline gap-2 mb-0.5">
						<span className="text-sm font-semibold text-white">{displayName}</span>
						<span className="text-[11px] text-slate-500">{formatMessageTime(message.created_at)}</span>
					</div>
				)}

				{isEditing ? (
					<div className="mt-1">
						<textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							onKeyDown={handleEditKeyDown}
							className="w-full px-3 py-2 bg-slate-800 border border-blue-500/30 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
							rows={2}
							autoFocus
						/>
						<div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
							<span>Enter = zapisz</span>
							<span>Escape = anuluj</span>
						</div>
					</div>
				) : (
					<>
						<p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
							<LinkifyText text={message.content} />
							{message.is_edited && (
								<span className="text-[10px] text-slate-600 ml-1">(edytowano)</span>
							)}
						</p>

						{/* Attachments */}
						{message.attachments && message.attachments.length > 0 && (
							<AttachmentPreview attachments={message.attachments} />
						)}

						{/* Reactions */}
						{message.reactions && message.reactions.length > 0 && (
							<ReactionBar
								reactions={message.reactions}
								currentUserId={currentUserId}
								onToggle={handleReaction}
							/>
						)}

						{/* Thread reply count badge */}
						{!isThreadParent && !message.parent_id && (message.reply_count ?? 0) > 0 && (
							<button
								onClick={() => openThread(message.id)}
								className="flex items-center gap-1 mt-1.5 px-2 py-1 rounded-md text-xs text-blue-400 hover:bg-blue-600/10 transition cursor-pointer"
							>
								<MessageSquare className="w-3 h-3" />
								{message.reply_count} {message.reply_count === 1 ? 'odpowiedź' : 'odpowiedzi'}
							</button>
						)}
					</>
				)}
			</div>

			{/* Action toolbar */}
			{isHovered && !isEditing && (
				<div className="absolute right-2 -top-3 flex items-center gap-0.5 bg-slate-800 border border-slate-700/50 rounded-lg p-0.5 shadow-lg z-10">
					{!isThreadParent && !message.parent_id && (
						<button
							onClick={() => openThread(message.id)}
							className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
							title="Odpowiedz w wątku"
						>
							<MessageSquare className="w-3.5 h-3.5" />
						</button>
					)}
					<div className="relative">
						<button
							onClick={() => setShowEmojiPicker(!showEmojiPicker)}
							className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
							title="Reakcja"
						>
							<SmilePlus className="w-3.5 h-3.5" />
						</button>
						{showEmojiPicker && (
							<EmojiPicker onSelect={handleReaction} onClose={() => setShowEmojiPicker(false)} />
						)}
					</div>
					{(isOwn || isAdmin) && (
						<button
							onClick={handleTogglePin}
							className={`p-1.5 rounded transition cursor-pointer ${
								message.is_pinned
									? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
									: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
							}`}
							title={message.is_pinned ? 'Odepnij' : 'Przypnij'}
						>
							<Pin className="w-3.5 h-3.5" />
						</button>
					)}
					{isOwn && (
						<>
							<button
								onClick={() => { setIsEditing(true); setEditContent(message.content); }}
								className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
								title="Edytuj"
							>
								<Pencil className="w-3.5 h-3.5" />
							</button>
							<button
								onClick={handleDelete}
								className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
								title="Usuń"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default MessageItem;

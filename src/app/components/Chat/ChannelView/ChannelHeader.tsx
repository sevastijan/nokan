'use client';

import { useState } from 'react';
import { ArrowLeft, Users, Hash, Pin, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useChat } from '@/app/context/ChatContext';
import Avatar from '@/app/components/Avatar/Avatar';
import { ChatChannel, ChatChannelMember } from '@/app/store/endpoints/chatEndpoints';
import { useGetPinnedMessagesQuery } from '@/app/store/apiSlice';
import { getUserDisplayName, getUserDisplayAvatar } from '../utils';
import ChannelSettingsModal from './ChannelSettingsModal';
import PinnedMessagesPanel from './PinnedMessagesPanel';

interface ChannelHeaderProps {
	members: ChatChannelMember[];
	currentUserId: string;
	channel: ChatChannel | null;
}

const ChannelHeader = ({ members, currentUserId, channel }: ChannelHeaderProps) => {
	const { t } = useTranslation();
	const { selectChannel } = useChat();
	const router = useRouter();
	const [showSettings, setShowSettings] = useState(false);
	const [showPinned, setShowPinned] = useState(false);

	const { data: pinnedMessages = [] } = useGetPinnedMessagesQuery(channel?.id ?? '', {
		skip: !channel?.id,
	});

	const isDm = channel?.type === 'dm';
	const otherMember = isDm ? members.find((m) => m.user_id !== currentUserId) : null;

	const displayName = isDm
		? getUserDisplayName(otherMember?.user)
		: channel?.name || t('chat.channel');

	const displayAvatar = isDm ? getUserDisplayAvatar(otherMember?.user) : '';

	const handleBack = () => {
		selectChannel(null);
		router.push('/chat');
	};

	return (
		<>
			<div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/60 shrink-0 bg-slate-900/80 backdrop-blur-sm">
				{/* Back arrow — mobile only */}
				<button
					onClick={handleBack}
					className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
				>
					<ArrowLeft className="w-4 h-4" />
				</button>

				{isDm ? (
					<div className="relative">
						<Avatar src={displayAvatar} alt={displayName} size={36} className="ring-2 ring-slate-800 ring-offset-1 ring-offset-slate-950" />
					</div>
				) : (
					<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600/20 to-brand-400/10 flex items-center justify-center border border-brand-500/20">
						<Hash className="w-4 h-4 text-brand-400" />
					</div>
				)}

				<div className="flex-1 min-w-0">
					<h2 className="text-[15px] font-semibold text-white truncate leading-tight">
						{isDm ? displayName : `# ${displayName}`}
					</h2>
					<div className="flex items-center gap-1.5 mt-0.5">
						{channel?.description ? (
							<p className="text-xs text-slate-500 truncate">{channel.description}</p>
						) : (
							<>
								<Users className="w-3 h-3 text-slate-600" />
								<span className="text-xs text-slate-500">{members.length} {t('chat.people', { count: members.length })}</span>
							</>
						)}
					</div>
				</div>

				{/* Right-side buttons */}
				<div className="flex items-center gap-1 shrink-0">
					<button
						onClick={() => setShowPinned(true)}
						className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
						title={t('chat.pinnedMessages')}
					>
						<Pin className="w-4 h-4" />
						{pinnedMessages.length > 0 && (
							<span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
								{pinnedMessages.length > 9 ? '9+' : pinnedMessages.length}
							</span>
						)}
					</button>
					{!isDm && (
						<button
							onClick={() => setShowSettings(true)}
							className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
							title={t('chat.channelSettings')}
						>
							<Settings className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>

			{showPinned && channel && (
				<PinnedMessagesPanel channelId={channel.id} onClose={() => setShowPinned(false)} />
			)}

			{showSettings && channel && !isDm && (
				<ChannelSettingsModal
					channel={channel}
					members={members}
					currentUserId={currentUserId}
					onClose={() => setShowSettings(false)}
				/>
			)}
		</>
	);
};

export default ChannelHeader;

'use client';

import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/app/components/Avatar/Avatar';
import { useGetPinnedMessagesQuery, useUnpinMessageMutation } from '@/app/store/apiSlice';
import { getUserDisplayName, getUserDisplayAvatar, formatMessageTime } from '../utils';

interface PinnedMessagesPanelProps {
	channelId: string;
	onClose: () => void;
}

const PinnedMessagesPanel = ({ channelId, onClose }: PinnedMessagesPanelProps) => {
	const { t } = useTranslation();
	const { data: pinnedMessages = [], isLoading } = useGetPinnedMessagesQuery(channelId);
	const [unpinMessage] = useUnpinMessageMutation();

	const handleUnpin = async (messageId: string) => {
		await unpinMessage({ messageId, channelId });
	};

	return (
		<Transition show={true} as={Fragment}>
			<Dialog as="div" className="relative z-[60]" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-150"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
				</TransitionChild>

				<div className="fixed inset-0 flex items-center justify-center p-4">
					<TransitionChild
						as={Fragment}
						enter="ease-out duration-200"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-150"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<DialogPanel className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
							{/* Header */}
							<div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
								<div className="flex items-center gap-2">
									<Pin className="w-4 h-4 text-amber-400" />
									<DialogTitle className="text-base font-semibold text-white">
										{t('chat.pinnedMessages')}
									</DialogTitle>
								</div>
								<button
									onClick={onClose}
									className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							{/* Pinned messages list */}
							<div className="overflow-y-auto flex-1 py-2">
								{isLoading ? (
									<div className="flex items-center justify-center py-12">
										<div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
									</div>
								) : pinnedMessages.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 text-center px-5">
										<Pin className="w-8 h-8 text-slate-700 mb-3" />
										<p className="text-sm text-slate-400">{t('chat.noPinnedMessages')}</p>
										<p className="text-xs text-slate-600 mt-1">
											{t('chat.pinHint')}
										</p>
									</div>
								) : (
									<div className="space-y-1 px-3">
										{pinnedMessages.map((msg) => {
											const displayName = getUserDisplayName(msg.user);
											const displayAvatar = getUserDisplayAvatar(msg.user);

											return (
												<div
													key={msg.id}
													className="group flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-slate-800/30 border-l-2 border-amber-500/30 transition"
												>
													<Avatar src={displayAvatar} alt={displayName} size={28} className="shrink-0 mt-0.5" />
													<div className="flex-1 min-w-0">
														<div className="flex items-baseline gap-2 mb-0.5">
															<span className="text-xs font-semibold text-white">{displayName}</span>
															<span className="text-[10px] text-slate-500">
																{msg.pinned_at ? formatMessageTime(msg.pinned_at) : ''}
															</span>
														</div>
														<p className="text-sm text-slate-300 line-clamp-3 whitespace-pre-wrap break-words">
															{msg.content}
														</p>
													</div>
													<button
														onClick={() => handleUnpin(msg.id)}
														className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer shrink-0"
														title={t('chat.unpin')}
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
};

export default PinnedMessagesPanel;

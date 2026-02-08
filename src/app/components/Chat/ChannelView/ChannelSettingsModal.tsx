'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Search, Crown, UserMinus } from 'lucide-react';
import Avatar from '@/app/components/Avatar/Avatar';
import { ChatChannel, ChatChannelMember } from '@/app/store/endpoints/chatEndpoints';
import {
	useAddChannelMemberMutation,
	useRemoveChannelMemberMutation,
	useGetAllUsersQuery,
	useRenameChannelMutation,
} from '@/app/store/apiSlice';
import { User } from '@/app/types/globalTypes';
import { getUserDisplayName, getUserDisplayAvatar } from '../utils';

interface ChannelSettingsModalProps {
	channel: ChatChannel;
	members: ChatChannelMember[];
	currentUserId: string;
	onClose: () => void;
}

const ChannelSettingsModal = ({ channel, members, currentUserId, onClose }: ChannelSettingsModalProps) => {
	const currentMember = members.find((m) => m.user_id === currentUserId);
	const isAdmin = currentMember?.role === 'admin';

	const [channelName, setChannelName] = useState(channel.name || '');
	const [search, setSearch] = useState('');

	const { data: allUsers = [] } = useGetAllUsersQuery();
	const [renameChannel, { isLoading: renaming }] = useRenameChannelMutation();
	const [addMember, { isLoading: adding }] = useAddChannelMemberMutation();
	const [removeMember] = useRemoveChannelMemberMutation();

	const memberUserIds = new Set(members.map((m) => m.user_id));
	const availableUsers = allUsers.filter((u: User) => {
		if (memberUserIds.has(u.id)) return false;
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return (
			(u.custom_name || u.name || '').toLowerCase().includes(q) ||
			u.email.toLowerCase().includes(q)
		);
	});

	const handleRename = async () => {
		const trimmed = channelName.trim();
		if (!trimmed || trimmed === channel.name) return;
		await renameChannel({ channelId: channel.id, name: trimmed, currentUserId });
	};

	const handleAddMember = async (userId: string) => {
		await addMember({ channelId: channel.id, userId, currentUserId });
	};

	const handleRemoveMember = async (userId: string) => {
		await removeMember({ channelId: channel.id, userId, currentUserId });
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
						<DialogPanel className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
							{/* Header */}
							<div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
								<DialogTitle className="text-base font-semibold text-white">
									Ustawienia kanału
								</DialogTitle>
								<button
									onClick={onClose}
									className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<div className="overflow-y-auto flex-1">
								{/* Rename section — admin only */}
								{isAdmin && (
									<div className="px-5 pt-4 pb-3 border-b border-slate-800/60">
										<label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
											Nazwa kanału
										</label>
										<div className="flex items-center gap-2 mt-2">
											<input
												type="text"
												value={channelName}
												onChange={(e) => setChannelName(e.target.value)}
												className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
												placeholder="Nazwa kanału"
											/>
											<button
												onClick={handleRename}
												disabled={renaming || !channelName.trim() || channelName.trim() === channel.name}
												className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
											>
												{renaming ? '...' : 'Zapisz'}
											</button>
										</div>
									</div>
								)}

								{/* Members section */}
								<div className="px-5 pt-4 pb-2">
									<label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
										Członkowie ({members.length})
									</label>
									<div className="mt-2 space-y-1">
										{members.map((member) => {
											const displayName = getUserDisplayName(member.user);
											const displayAvatar = getUserDisplayAvatar(member.user);
											const isSelf = member.user_id === currentUserId;

											return (
												<div
													key={member.id}
													className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/30 transition"
												>
													<Avatar src={displayAvatar} alt={displayName} size={32} />
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5">
															<p className="text-sm font-medium text-white truncate">{displayName}</p>
															{isSelf && <span className="text-[10px] text-slate-500">(Ty)</span>}
														</div>
														<p className="text-xs text-slate-500 truncate">{member.user?.email}</p>
													</div>
													{member.role === 'admin' && (
														<div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 shrink-0">
															<Crown className="w-3 h-3 text-amber-400" />
															<span className="text-[10px] font-medium text-amber-400">Admin</span>
														</div>
													)}
													{isAdmin && member.role !== 'admin' && !isSelf && (
														<button
															onClick={() => handleRemoveMember(member.user_id)}
															className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer shrink-0"
															title="Usuń z kanału"
														>
															<UserMinus className="w-3.5 h-3.5" />
														</button>
													)}
												</div>
											);
										})}
									</div>
								</div>

								{/* Add members — admin only */}
								{isAdmin && (
									<div className="px-5 pt-2 pb-4">
										<label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
											Dodaj osoby
										</label>
										<div className="relative mt-2">
											<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
											<input
												type="text"
												placeholder="Szukaj użytkowników..."
												value={search}
												onChange={(e) => setSearch(e.target.value)}
												className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
											/>
										</div>
										<div className="mt-2 max-h-40 overflow-y-auto space-y-1">
											{availableUsers.map((user: User) => {
												const displayName = user.custom_name || user.name || user.email;
												const displayAvatar = user.custom_image || user.image || '';

												return (
													<button
														key={user.id}
														onClick={() => handleAddMember(user.id)}
														disabled={adding}
														className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/40 transition cursor-pointer disabled:opacity-50"
													>
														<Avatar src={displayAvatar} alt={displayName} size={28} />
														<div className="flex-1 min-w-0 text-left">
															<p className="text-sm font-medium text-white truncate">{displayName}</p>
															<p className="text-xs text-slate-500 truncate">{user.email}</p>
														</div>
														<span className="text-xs text-blue-400 shrink-0">Dodaj</span>
													</button>
												);
											})}
											{availableUsers.length === 0 && search.trim() && (
												<p className="text-center text-xs text-slate-500 py-3">Brak wyników</p>
											)}
										</div>
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

export default ChannelSettingsModal;

'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Search, Users, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useGetAllUsersQuery, useCreateDmChannelMutation, useCreateGroupChannelMutation } from '@/app/store/apiSlice';
import { useChat } from '@/app/context/ChatContext';
import Avatar from '@/app/components/Avatar/Avatar';
import { User } from '@/app/types/globalTypes';

type Mode = 'dm' | 'group';

interface CreateChannelModalProps {
	onClose: () => void;
	initialMode?: 'dm' | 'group';
}

const CreateChannelModal = ({ onClose, initialMode = 'dm' }: CreateChannelModalProps) => {
	const { currentUser } = useCurrentUser();
	const { selectChannel, openMiniChat } = useChat();
	const router = useRouter();
	const { data: allUsers = [] } = useGetAllUsersQuery();

	const [mode, setMode] = useState<Mode>(initialMode);
	const [search, setSearch] = useState('');
	const [groupName, setGroupName] = useState('');
	const [groupDescription, setGroupDescription] = useState('');
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

	const [createDm, { isLoading: creatingDm }] = useCreateDmChannelMutation();
	const [createGroup, { isLoading: creatingGroup }] = useCreateGroupChannelMutation();

	const isLoading = creatingDm || creatingGroup;

	const otherUsers = allUsers.filter((u: User) => u.id !== currentUser?.id);
	const filteredUsers = otherUsers.filter((u: User) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return (
			(u.custom_name || u.name || '').toLowerCase().includes(q) ||
			u.email.toLowerCase().includes(q)
		);
	});

	const toggleUser = (userId: string) => {
		if (mode === 'dm') {
			setSelectedUserIds([userId]);
		} else {
			setSelectedUserIds((prev) =>
				prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
			);
		}
	};

	const handleCreate = async () => {
		if (!currentUser?.id) return;

		try {
			let channelId: string | null = null;

			if (mode === 'dm' && selectedUserIds.length === 1) {
				const result = await createDm({
					currentUserId: currentUser.id,
					otherUserId: selectedUserIds[0],
				}).unwrap();
				channelId = result.id;
			} else if (mode === 'group' && groupName.trim() && selectedUserIds.length > 0) {
				const result = await createGroup({
					name: groupName.trim(),
					description: groupDescription.trim() || undefined,
					memberIds: selectedUserIds,
					createdBy: currentUser.id,
				}).unwrap();
				channelId = result.id;
			}

			if (channelId) {
				if (mode === 'dm') {
					openMiniChat(channelId);
				} else {
					selectChannel(channelId);
					router.push(`/chat?channel=${channelId}`);
				}
			}
			onClose();
		} catch (err) {
			console.error('[CreateChannel] Error:', err);
		}
	};

	const canCreate =
		mode === 'dm'
			? selectedUserIds.length === 1
			: groupName.trim().length > 0 && selectedUserIds.length > 0;

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
						<DialogPanel className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
							{/* Header */}
							<div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
								<DialogTitle className="text-base font-semibold text-white">
									Nowa rozmowa
								</DialogTitle>
								<button
									onClick={onClose}
									className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							{/* Mode tabs */}
							<div className="flex gap-1 px-5 pt-4">
								<button
									onClick={() => { setMode('dm'); setSelectedUserIds([]); }}
									className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
										mode === 'dm' ? 'bg-blue-600/15 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
									}`}
								>
									<MessageCircle className="w-3.5 h-3.5" />
									Wiadomość
								</button>
								<button
									onClick={() => { setMode('group'); setSelectedUserIds([]); }}
									className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
										mode === 'group' ? 'bg-blue-600/15 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
									}`}
								>
									<Users className="w-3.5 h-3.5" />
									Kanał grupowy
								</button>
							</div>

							{/* Group name + description */}
							{mode === 'group' && (
								<div className="px-5 pt-3 space-y-2">
									<input
										type="text"
										placeholder="Nazwa kanału"
										value={groupName}
										onChange={(e) => setGroupName(e.target.value)}
										className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
									/>
									<input
										type="text"
										placeholder="Opis (opcjonalnie)"
										value={groupDescription}
										onChange={(e) => setGroupDescription(e.target.value)}
										className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
									/>
								</div>
							)}

							{/* Search */}
							<div className="px-5 pt-3">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
									<input
										type="text"
										placeholder="Szukaj użytkowników..."
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
									/>
								</div>
							</div>

							{/* User list */}
							<div className="px-3 py-3 max-h-60 overflow-y-auto">
								{filteredUsers.map((user: User) => {
									const isSelected = selectedUserIds.includes(user.id);
									const displayName = user.custom_name || user.name || user.email;
									const displayAvatar = user.custom_image || user.image || '';

									return (
										<button
											key={user.id}
											onClick={() => toggleUser(user.id)}
											className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition cursor-pointer ${
												isSelected
													? 'bg-blue-600/10 ring-1 ring-blue-500/30'
													: 'hover:bg-slate-800/40'
											}`}
										>
											<Avatar src={displayAvatar} alt={displayName} size={32} />
											<div className="flex-1 min-w-0 text-left">
												<p className="text-sm font-medium text-white truncate">{displayName}</p>
												<p className="text-xs text-slate-500 truncate">{user.email}</p>
											</div>
											{isSelected && (
												<div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
													<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
													</svg>
												</div>
											)}
										</button>
									);
								})}
								{filteredUsers.length === 0 && (
									<p className="text-center text-sm text-slate-500 py-4">Brak użytkowników</p>
								)}
							</div>

							{/* Footer */}
							<div className="px-5 py-4 border-t border-slate-800 flex justify-end gap-2">
								<button
									onClick={onClose}
									className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
								>
									Anuluj
								</button>
								<button
									onClick={handleCreate}
									disabled={!canCreate || isLoading}
									className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
								>
									{isLoading ? 'Tworzenie...' : mode === 'dm' ? 'Rozpocznij rozmowę' : 'Utwórz kanał'}
								</button>
							</div>
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
};

export default CreateChannelModal;

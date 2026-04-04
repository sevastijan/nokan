'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUserPlus, FiX, FiUsers, FiSearch, FiCheck, FiLoader, FiMail, FiSend, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import Avatar from '@/app/components/Avatar/Avatar';
import { toast } from 'sonner';
import {
	useGetAllUsersQuery,
	useGetBoardMembersQuery,
	useAddMemberToBoardMutation,
	useRemoveMemberFromBoardMutation,
	useSendBoardInvitationMutation,
	useGetBoardInvitationsQuery,
	useCancelBoardInvitationMutation,
} from '@/app/store/apiSlice';

interface MembersDropdownProps {
	boardId: string;
	currentUserId?: string;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
}

const getDisplayData = (user: { name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string }) => ({
	name: user.custom_name || user.name || user.email || 'Użytkownik',
	image: user.custom_image || user.image,
});

const MembersDropdown = ({ boardId, currentUserId, isOpen, onToggle, onClose }: MembersDropdownProps) => {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLDivElement>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [pendingAdd, setPendingAdd] = useState<Set<string>>(new Set());
	const [pendingRemove, setPendingRemove] = useState<Set<string>>(new Set());

	// Invite state
	const [inviteEmail, setInviteEmail] = useState('');
	const [sendInvitation, { isLoading: isSending }] = useSendBoardInvitationMutation();
	const { data: pendingInvitations = [] } = useGetBoardInvitationsQuery(boardId, { skip: !isOpen });
	const [cancelInvitation] = useCancelBoardInvitationMutation();

	const { data: allUsers = [] } = useGetAllUsersQuery();
	const { data: boardMembers = [], refetch: refetchMembers } = useGetBoardMembersQuery(boardId);
	const [addMember] = useAddMemberToBoardMutation();
	const [removeMember] = useRemoveMemberFromBoardMutation();

	useOutsideClick([containerRef], onClose, isOpen);

	const availableToAdd = useMemo(
		() => allUsers.filter((u) => u.id !== currentUserId && !boardMembers.some((m) => m.id === u.id)),
		[allUsers, currentUserId, boardMembers],
	);

	const filteredUsers = useMemo(() => {
		if (!searchQuery.trim()) return availableToAdd;
		const q = searchQuery.toLowerCase();
		return availableToAdd.filter((u) => {
			const name = (u.custom_name || u.name || '').toLowerCase();
			const email = (u.email || '').toLowerCase();
			return name.includes(q) || email.includes(q);
		});
	}, [availableToAdd, searchQuery]);

	const handleAddUser = useCallback(
		async (userId: string) => {
			if (pendingAdd.has(userId)) return;
			setPendingAdd((prev) => new Set(prev).add(userId));
			try {
				await addMember({ boardId, userId }).unwrap();
				await refetchMembers();
				toast.success(t('membersDropdown.userAdded'));
			} catch {
				toast.error(t('membersDropdown.addFailed'));
			} finally {
				setPendingAdd((prev) => {
					const next = new Set(prev);
					next.delete(userId);
					return next;
				});
			}
		},
		[addMember, boardId, refetchMembers, pendingAdd, t],
	);

	const handleRemoveUser = useCallback(
		async (userId: string) => {
			if (userId === currentUserId || pendingRemove.has(userId)) return;
			setPendingRemove((prev) => new Set(prev).add(userId));
			try {
				await removeMember({ boardId, userId }).unwrap();
				await refetchMembers();
				toast.success(t('membersDropdown.userRemoved'));
			} catch {
				toast.error(t('membersDropdown.removeFailed'));
			} finally {
				setPendingRemove((prev) => {
					const next = new Set(prev);
					next.delete(userId);
					return next;
				});
			}
		},
		[removeMember, boardId, currentUserId, refetchMembers, pendingRemove, t],
	);

	const handleSendInvite = useCallback(async () => {
		const trimmed = inviteEmail.trim().toLowerCase();
		if (!trimmed) return;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmed)) {
			toast.error('Podaj poprawny adres email');
			return;
		}

		try {
			const result = await sendInvitation({ boardId, email: trimmed }).unwrap();
			if (result.success) {
				toast.success(`Zaproszenie wysłane do ${trimmed}`);
				setInviteEmail('');
			}
		} catch (err: unknown) {
			const errorData = err as { data?: string };
			toast.error(errorData?.data || 'Nie udało się wysłać zaproszenia');
		}
	}, [inviteEmail, boardId, sendInvitation]);

	const handleCancelInvite = useCallback(async (invitationId: string, email: string) => {
		try {
			await cancelInvitation({ invitationId, boardId }).unwrap();
			toast.success(`Anulowano zaproszenie dla ${email}`);
		} catch {
			toast.error('Nie udało się anulować zaproszenia');
		}
	}, [cancelInvitation, boardId]);

	return (
		<div className="relative" ref={containerRef}>
			<button
				onClick={onToggle}
				className={`relative p-1.5 rounded-md transition-colors ${
					isOpen ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
				}`}
				title={t('membersDropdown.boardMembers')}
			>
				<FiUsers className="w-4 h-4" />
				{boardMembers.length > 0 && (
					<span className="absolute -top-1 -right-1 bg-slate-600 text-slate-200 text-[9px] font-medium min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
						{boardMembers.length}
					</span>
				)}
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.15 }}
						className="fixed sm:absolute right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] sm:w-80 max-w-80 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50"
					>
						{/* Header */}
						<div className="px-4 py-3 border-b border-slate-700">
							<span className="text-sm font-medium text-slate-200">{t('membersDropdown.boardMembers')}</span>
						</div>

						{/* Current Members */}
						<div className="p-3 border-b border-slate-700">
							<div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">
								{t('membersDropdown.current', { count: boardMembers.length })}
							</div>

							{boardMembers.length === 0 ? (
								<div className="text-center py-3 text-slate-500 text-sm">
									<FiUsers className="w-5 h-5 mx-auto mb-1 opacity-50" />
									{t('membersDropdown.noMembers')}
								</div>
							) : (
								<ul className="space-y-1 max-h-40 overflow-y-auto">
									{boardMembers.map((user) => {
										const userDisplay = getDisplayData(user);
										const isCurrentUser = user.id === currentUserId;
										const isRemoving = pendingRemove.has(user.id);

										return (
											<li
												key={user.id}
												className={`flex items-center justify-between p-2 rounded-lg ${
													isRemoving ? 'opacity-40' : isCurrentUser ? 'bg-slate-700/30' : 'hover:bg-slate-700/30'
												}`}
											>
												<div className="flex items-center gap-2.5 min-w-0">
													<Avatar src={userDisplay.image || ''} alt={userDisplay.name} size={28} />
													<div className="min-w-0">
														<div className="text-sm text-slate-200 truncate flex items-center gap-1.5">
															{userDisplay.name}
															{isCurrentUser && <span className="text-[10px] text-slate-500">{t('common.you')}</span>}
														</div>
														<div className="text-xs text-slate-500 truncate">{user.email}</div>
													</div>
												</div>

												{!isCurrentUser && (
													<button
														onClick={() => handleRemoveUser(user.id)}
														disabled={isRemoving}
														className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors disabled:pointer-events-none"
														title={t('membersDropdown.remove')}
													>
														{isRemoving ? (
															<FiLoader className="w-4 h-4 animate-spin" />
														) : (
															<FiX className="w-4 h-4" />
														)}
													</button>
												)}
											</li>
										);
									})}
								</ul>
							)}
						</div>

						{/* Add New Members */}
						{availableToAdd.length > 0 && (
							<div className="p-3 border-b border-slate-700">
								<div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">{t('membersDropdown.addNew')}</div>

								<div className="relative mb-2">
									<FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
									<input
										type="text"
										placeholder={t('membersDropdown.search')}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-full pl-8 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
									/>
								</div>

								<ul className="space-y-0.5 max-h-40 overflow-y-auto">
									{filteredUsers.length === 0 ? (
										<li className="text-center py-3 text-slate-500 text-sm">{t('membersDropdown.noResults')}</li>
									) : (
										filteredUsers.map((user) => {
											const userDisplay = getDisplayData(user);
											const isAdding = pendingAdd.has(user.id);

											return (
												<li
													key={user.id}
													onClick={() => !isAdding && handleAddUser(user.id)}
													className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
														isAdding ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:bg-slate-700/50'
													}`}
												>
													<Avatar src={userDisplay.image || ''} alt={userDisplay.name} size={28} />
													<div className="min-w-0 flex-1">
														<div className="text-sm text-slate-200 truncate">{userDisplay.name}</div>
														<div className="text-xs text-slate-500 truncate">{user.email}</div>
													</div>
													{isAdding && <FiLoader className="w-4 h-4 text-slate-400 animate-spin" />}
												</li>
											);
										})
									)}
								</ul>
							</div>
						)}

						{/* Invite by Email */}
						<div className="p-3">
							<div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">
								<FiMail className="w-3 h-3 inline mr-1" />
								Zaproś przez email
							</div>

							<div className="flex gap-1.5">
								<input
									type="email"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendInvite()}
									placeholder="adres@email.com"
									className="flex-1 min-w-0 h-9 px-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
								/>
								<button
									onClick={handleSendInvite}
									disabled={isSending || !inviteEmail.trim()}
									className="h-9 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
								>
									{isSending ? (
										<FiLoader className="w-3.5 h-3.5 animate-spin" />
									) : (
										<FiSend className="w-3.5 h-3.5" />
									)}
								</button>
							</div>

							{/* Pending invitations */}
							{pendingInvitations.length > 0 && (
								<div className="mt-2.5 space-y-1">
									{pendingInvitations.map((inv) => (
										<div
											key={inv.id}
											className="flex items-center justify-between px-2.5 py-1.5 bg-slate-700/30 rounded-lg group"
										>
											<div className="flex items-center gap-2 min-w-0">
												<div className="w-6 h-6 bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0">
													<FiMail className="w-3 h-3 text-indigo-400" />
												</div>
												<span className="text-xs text-slate-400 truncate">{inv.email}</span>
											</div>
											<button
												onClick={() => handleCancelInvite(inv.id, inv.email)}
												className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
												title="Anuluj zaproszenie"
											>
												<FiTrash2 className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default MembersDropdown;

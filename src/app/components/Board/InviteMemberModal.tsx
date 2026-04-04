'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FiX, FiMail, FiTrash2, FiSend } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
	useSendBoardInvitationMutation,
	useGetBoardInvitationsQuery,
	useCancelBoardInvitationMutation,
} from '@/app/store/apiSlice';

interface InviteMemberModalProps {
	boardId: string;
	isOpen: boolean;
	onClose: () => void;
}

export default function InviteMemberModal({ boardId, isOpen, onClose }: InviteMemberModalProps) {
	const [email, setEmail] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const [sendInvitation, { isLoading: isSending }] = useSendBoardInvitationMutation();
	const { data: pendingInvitations = [] } = useGetBoardInvitationsQuery(boardId, { skip: !isOpen });
	const [cancelInvitation] = useCancelBoardInvitationMutation();

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		} else {
			setEmail('');
		}
	}, [isOpen]);

	const handleSend = useCallback(async () => {
		const trimmed = email.trim().toLowerCase();
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
				setEmail('');
				inputRef.current?.focus();
			}
		} catch (err: unknown) {
			const errorData = err as { data?: string };
			toast.error(errorData?.data || 'Nie udało się wysłać zaproszenia');
		}
	}, [email, boardId, sendInvitation]);

	const handleCancel = useCallback(async (invitationId: string, invitationEmail: string) => {
		try {
			await cancelInvitation({ invitationId, boardId }).unwrap();
			toast.success(`Anulowano zaproszenie dla ${invitationEmail}`);
		} catch {
			toast.error('Nie udało się anulować zaproszenia');
		}
	}, [cancelInvitation, boardId]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isSending) {
			handleSend();
		}
	}, [handleSend, isSending]);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 z-40"
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						transition={{ duration: 0.15 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
						onClick={(e) => e.target === e.currentTarget && onClose()}
					>
						<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
							{/* Header */}
							<div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
										<FiMail className="w-4 h-4 text-indigo-400" />
									</div>
									<div>
										<h3 className="text-sm font-semibold text-white">Zaproś do tablicy</h3>
										<p className="text-[11px] text-slate-500">Wyślij zaproszenie na adres email</p>
									</div>
								</div>
								<button
									onClick={onClose}
									className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
								>
									<FiX className="w-4 h-4" />
								</button>
							</div>

							{/* Body */}
							<div className="p-5 space-y-4">
								{/* Email input */}
								<div className="flex gap-2">
									<input
										ref={inputRef}
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder="adres@email.com"
										className="flex-1 h-10 px-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
									/>
									<button
										onClick={handleSend}
										disabled={isSending || !email.trim()}
										className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
									>
										{isSending ? (
											<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										) : (
											<FiSend className="w-3.5 h-3.5" />
										)}
										Wyślij
									</button>
								</div>

								{/* Pending invitations */}
								{pendingInvitations.length > 0 && (
									<div>
										<p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
											Oczekujące zaproszenia ({pendingInvitations.length})
										</p>
										<div className="space-y-1.5 max-h-48 overflow-y-auto">
											{pendingInvitations.map((inv) => (
												<div
													key={inv.id}
													className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-lg group"
												>
													<div className="flex items-center gap-2.5 min-w-0">
														<div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
															<FiMail className="w-3 h-3 text-slate-400" />
														</div>
														<span className="text-sm text-slate-300 truncate">{inv.email}</span>
													</div>
													<button
														onClick={() => handleCancel(inv.id, inv.email)}
														className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
														title="Anuluj zaproszenie"
													>
														<FiTrash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

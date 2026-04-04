'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertCircle, FiClock } from 'react-icons/fi';

interface InvitationData {
	status: 'pending' | 'already_used' | 'expired';
	boardName?: string;
	inviterName?: string;
	email?: string;
	boardId?: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const { data: session, status: sessionStatus } = useSession();
	const router = useRouter();

	const [invitation, setInvitation] = useState<InvitationData | null>(null);
	const [loading, setLoading] = useState(true);
	const [accepting, setAccepting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [accepted, setAccepted] = useState(false);

	// Fetch invitation data
	useEffect(() => {
		async function fetchInvitation() {
			try {
				const res = await fetch(`/api/invitations/${token}`);
				const data = await res.json();

				if (!res.ok) {
					setError(data.error || 'Nie znaleziono zaproszenia');
					return;
				}

				setInvitation(data);
			} catch {
				setError('Wystąpił błąd podczas ładowania zaproszenia');
			} finally {
				setLoading(false);
			}
		}

		fetchInvitation();
	}, [token]);

	// Auto-accept when logged in
	const acceptInvitation = useCallback(async () => {
		if (accepting || accepted) return;
		setAccepting(true);

		try {
			const res = await fetch(`/api/invitations/${token}/accept`, {
				method: 'POST',
				credentials: 'include',
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Nie udało się zaakceptować zaproszenia');
				setAccepting(false);
				return;
			}

			setAccepted(true);
			setTimeout(() => {
				router.push(`/board/${data.boardId}`);
			}, 1500);
		} catch {
			setError('Wystąpił błąd');
			setAccepting(false);
		}
	}, [token, accepting, accepted, router]);

	useEffect(() => {
		if (sessionStatus === 'authenticated' && invitation?.status === 'pending' && !accepting && !accepted) {
			acceptInvitation();
		}
	}, [sessionStatus, invitation, acceptInvitation, accepting, accepted]);

	// Loading state
	if (loading || sessionStatus === 'loading') {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center">
				<div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"
				>
					<div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<FiAlertCircle className="w-6 h-6 text-red-400" />
					</div>
					<h2 className="text-lg font-semibold text-white mb-2">Błąd</h2>
					<p className="text-sm text-slate-400 mb-6">{error}</p>
					<button
						onClick={() => router.push('/')}
						className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
					>
						Przejdź do strony głównej
					</button>
				</motion.div>
			</div>
		);
	}

	// Expired / already used
	if (invitation?.status === 'expired') {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"
				>
					<div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<FiClock className="w-6 h-6 text-amber-400" />
					</div>
					<h2 className="text-lg font-semibold text-white mb-2">Zaproszenie wygasło</h2>
					<p className="text-sm text-slate-400 mb-6">To zaproszenie nie jest już aktywne. Poproś o ponowne wysłanie zaproszenia.</p>
					<button
						onClick={() => router.push('/')}
						className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
					>
						Przejdź do strony głównej
					</button>
				</motion.div>
			</div>
		);
	}

	if (invitation?.status === 'already_used') {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"
				>
					<div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<FiCheck className="w-6 h-6 text-green-400" />
					</div>
					<h2 className="text-lg font-semibold text-white mb-2">Zaproszenie już wykorzystane</h2>
					<p className="text-sm text-slate-400 mb-6">To zaproszenie zostało już zaakceptowane.</p>
					<button
						onClick={() => router.push('/dashboard')}
						className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
					>
						Przejdź do dashboardu
					</button>
				</motion.div>
			</div>
		);
	}

	// Accepting state (logged in, auto-accepting)
	if (accepting || accepted) {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"
				>
					{accepted ? (
						<>
							<div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
								<FiCheck className="w-6 h-6 text-green-400" />
							</div>
							<h2 className="text-lg font-semibold text-white mb-2">Dołączono do tablicy!</h2>
							<p className="text-sm text-slate-400">Przekierowuję do tablicy <strong className="text-white">{invitation?.boardName}</strong>...</p>
						</>
					) : (
						<>
							<div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
							<p className="text-sm text-slate-400">Dołączanie do tablicy...</p>
						</>
					)}
				</motion.div>
			</div>
		);
	}

	// Not logged in - show login options
	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8"
			>
				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<line x1="3" y1="9" x2="21" y2="9" />
							<line x1="9" y1="21" x2="9" y2="9" />
						</svg>
					</div>
					<h1 className="text-lg font-semibold text-white mb-2">Zaproszenie do tablicy</h1>
					<p className="text-sm text-slate-400">
						<strong className="text-white">{invitation?.inviterName}</strong> zaprasza Cię do tablicy{' '}
						<strong className="text-white">{invitation?.boardName}</strong>
					</p>
				</div>

				{/* Auth buttons */}
				<div className="space-y-3">
					<button
						onClick={() => signIn('google', { callbackUrl: `/invite/${token}` })}
						className="w-full flex items-center justify-center gap-3 h-12 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600/50 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
						</svg>
						Kontynuuj przez Google
					</button>

					<button
						onClick={() => signIn('github', { callbackUrl: `/invite/${token}` })}
						className="w-full flex items-center justify-center gap-3 h-12 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600/50 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
						</svg>
						Kontynuuj przez GitHub
					</button>
				</div>

				{/* Divider */}
				<div className="flex items-center gap-3 my-6">
					<div className="flex-1 h-px bg-slate-800" />
					<span className="text-xs text-slate-600">lub</span>
					<div className="flex-1 h-px bg-slate-800" />
				</div>

				{/* Email info */}
				<p className="text-xs text-slate-500 text-center">
					Zaproszenie wysłano na <strong className="text-slate-400">{invitation?.email}</strong>. Zaloguj się lub utwórz konto, aby dołączyć.
				</p>
			</motion.div>
		</div>
	);
}

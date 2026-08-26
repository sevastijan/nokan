'use client';

import { useState, useCallback, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';

type Mode = 'login' | 'register';
type Accent = 'brand' | 'indigo';

const ACCENTS: Record<Accent, { button: string; link: string; focus: string; tab: string }> = {
	brand: {
		button: 'bg-brand-600 hover:bg-brand-500',
		link: 'text-brand-400 hover:text-brand-300',
		focus: 'focus:border-brand-500/60',
		tab: 'bg-brand-600/15 text-brand-300',
	},
	indigo: {
		button: 'bg-indigo-600 hover:bg-indigo-500',
		link: 'text-indigo-400 hover:text-indigo-300',
		focus: 'focus:border-indigo-500/60',
		tab: 'bg-indigo-600/15 text-indigo-300',
	},
};

/** Maps API error codes from /api/auth/register to translation keys. */
const REGISTER_ERROR_KEYS: Record<string, string> = {
	duplicate_email: 'auth.emailAlreadyExists',
	oauth_account: 'auth.oauthAccountExists',
	invalid_email: 'auth.invalidEmail',
	validation: 'auth.registrationFailed',
	server: 'auth.registrationFailed',
};

interface EmailPasswordFormProps {
	/** Where to land after a successful login/registration. */
	callbackUrl?: string;
	/** Pre-fills the email field (e.g. the address an invitation was sent to). */
	defaultEmail?: string;
	/** Locks the email field - used when the address is dictated by an invitation. */
	lockEmail?: boolean;
	accent?: Accent;
}

export default function EmailPasswordForm({
	callbackUrl = '/dashboard',
	defaultEmail = '',
	lockEmail = false,
	accent = 'brand',
}: EmailPasswordFormProps) {
	const { t } = useTranslation();

	const [mode, setMode] = useState<Mode>('login');
	const [name, setName] = useState('');
	const [email, setEmail] = useState(defaultEmail);
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const c = ACCENTS[accent];
	const inputClass = useMemo(
		() =>
			`w-full h-11 px-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors disabled:opacity-60 ${c.focus}`,
		[c.focus]
	);

	const switchMode = useCallback((next: Mode) => {
		setMode(next);
		setError(null);
		setPassword('');
		setConfirmPassword('');
	}, []);

	/** Signs in with credentials and hard-navigates so the new session is picked up everywhere. */
	const signInWithCredentials = useCallback(
		async (userEmail: string, userPassword: string) => {
			const result = await signIn('credentials', {
				email: userEmail,
				password: userPassword,
				redirect: false,
				callbackUrl,
			});

			if (!result || result.error) {
				setError(t('auth.invalidCredentials'));
				setSubmitting(false);
				return;
			}

			// Full navigation guarantees the server sees the fresh session cookie
			// (the invite page auto-accepts as soon as it loads authenticated).
			window.location.assign(result.url || callbackUrl);
		},
		[callbackUrl, t]
	);

	const handleSubmit = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			if (submitting) return;

			const trimmedEmail = email.trim().toLowerCase();
			setError(null);

			if (mode === 'login') {
				setSubmitting(true);
				await signInWithCredentials(trimmedEmail, password);
				return;
			}

			if (!name.trim()) {
				setError(t('auth.registrationFailed'));
				return;
			}
			if (password.length < 8) {
				setError(t('auth.passwordTooShort'));
				return;
			}
			if (password !== confirmPassword) {
				setError(t('auth.passwordsDoNotMatch'));
				return;
			}

			setSubmitting(true);

			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: name.trim(), email: trimmedEmail, password, confirmPassword }),
				});
				const data = await response.json();

				if (!response.ok) {
					setError(t(REGISTER_ERROR_KEYS[data.code] || 'auth.registrationFailed'));
					setSubmitting(false);
					return;
				}

				await signInWithCredentials(trimmedEmail, password);
			} catch {
				setError(t('auth.registrationFailed'));
				setSubmitting(false);
			}
		},
		[submitting, mode, name, email, password, confirmPassword, signInWithCredentials, t]
	);

	const isRegister = mode === 'register';

	return (
		<div className="space-y-4">
			{/* Mode tabs */}
			<div className="flex gap-1 p-1 bg-slate-800/40 rounded-xl" role="tablist">
				{(['login', 'register'] as const).map((value) => (
					<button
						key={value}
						type="button"
						role="tab"
						aria-selected={mode === value}
						onClick={() => switchMode(value)}
						className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
							mode === value ? c.tab : 'text-slate-500 hover:text-slate-300'
						}`}
					>
						{t(value === 'login' ? 'auth.tabLogin' : 'auth.tabRegister')}
					</button>
				))}
			</div>

			<form onSubmit={handleSubmit} className="space-y-3">
				<AnimatePresence initial={false}>
					{isRegister && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.18 }}
							className="overflow-hidden"
						>
							<label htmlFor="auth-name" className="sr-only">
								{t('auth.namePlaceholder')}
							</label>
							<input
								id="auth-name"
								type="text"
								autoComplete="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t('auth.namePlaceholder')}
								className={inputClass}
								required
							/>
						</motion.div>
					)}
				</AnimatePresence>

				<div>
					<label htmlFor="auth-email" className="sr-only">
						{t('auth.emailPlaceholder')}
					</label>
					<input
						id="auth-email"
						type="email"
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t('auth.emailPlaceholder')}
						className={inputClass}
						disabled={lockEmail}
						readOnly={lockEmail}
						required
					/>
				</div>

				<div>
					<label htmlFor="auth-password" className="sr-only">
						{t('auth.passwordPlaceholder')}
					</label>
					<input
						id="auth-password"
						type="password"
						autoComplete={isRegister ? 'new-password' : 'current-password'}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder={t('auth.passwordPlaceholder')}
						className={inputClass}
						minLength={isRegister ? 8 : undefined}
						required
					/>
				</div>

				<AnimatePresence initial={false}>
					{isRegister && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.18 }}
							className="overflow-hidden"
						>
							<label htmlFor="auth-confirm-password" className="sr-only">
								{t('auth.confirmPasswordPlaceholder')}
							</label>
							<input
								id="auth-confirm-password"
								type="password"
								autoComplete="new-password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder={t('auth.confirmPasswordPlaceholder')}
								className={inputClass}
								required
							/>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{error && (
						<motion.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							role="alert"
							className="flex items-start gap-2 text-xs text-red-400"
						>
							<FiAlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
							{error}
						</motion.p>
					)}
				</AnimatePresence>

				<motion.button
					whileTap={{ scale: 0.98 }}
					type="submit"
					disabled={submitting}
					className={`w-full h-11 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-slate-400 ${c.button}`}
				>
					{submitting
						? t(isRegister ? 'auth.registering' : 'auth.signingIn')
						: t(isRegister ? 'auth.createAccount' : 'auth.signIn')}
				</motion.button>
			</form>

			<p className="text-center text-xs text-slate-500">
				{t(isRegister ? 'auth.alreadyHaveAccount' : 'auth.noAccount')}{' '}
				<button
					type="button"
					onClick={() => switchMode(isRegister ? 'login' : 'register')}
					className={`font-medium transition-colors cursor-pointer ${c.link}`}
				>
					{t(isRegister ? 'auth.signInLink' : 'auth.registerLink')}
				</button>
			</p>
		</div>
	);
}

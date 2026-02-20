'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Loader from '../components/Loader';

type Tab = 'login' | 'register';

const AuthButton = () => {
	const { t } = useTranslation();
	const { data: session, status } = useSession();
	const router = useRouter();

	const [tab, setTab] = useState<Tab>('login');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const [loginEmail, setLoginEmail] = useState('');
	const [loginPassword, setLoginPassword] = useState('');

	const [registerName, setRegisterName] = useState('');
	const [registerEmail, setRegisterEmail] = useState('');
	const [registerPassword, setRegisterPassword] = useState('');
	const [registerConfirm, setRegisterConfirm] = useState('');

	const switchTab = (next: Tab) => {
		setTab(next);
		setError('');
		setSuccessMessage('');
	};

	const handleLoginSuccess = () => {
		router.push('/dashboard');
	};

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setSuccessMessage('');
		setLoading(true);

		const result = await signIn('credentials', {
			redirect: false,
			email: loginEmail,
			password: loginPassword,
		});

		setLoading(false);

		if (result?.error) {
			setError(t('auth.invalidCredentials'));
		} else {
			handleLoginSuccess();
		}
	};

	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setSuccessMessage('');

		if (registerPassword.length < 8) {
			setError(t('auth.passwordTooShort'));
			return;
		}

		if (registerPassword !== registerConfirm) {
			setError(t('auth.passwordsDoNotMatch'));
			return;
		}

		setLoading(true);

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: registerName,
					email: registerEmail,
					password: registerPassword,
					confirmPassword: registerConfirm,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setLoading(false);
				if (data.code === 'duplicate_email') {
					setError(t('auth.emailAlreadyExists'));
				} else {
					setError(t('auth.registrationFailed'));
				}
				return;
			}

			const signInResult = await signIn('credentials', {
				redirect: false,
				email: registerEmail,
				password: registerPassword,
			});

			setLoading(false);

			if (signInResult?.error) {
				setSuccessMessage(t('auth.registeredPleaseLogin'));
				setTab('login');
				setLoginEmail(registerEmail);
			} else {
				handleLoginSuccess();
			}
		} catch {
			setLoading(false);
			setError(t('auth.registrationFailed'));
		}
	};

	if (status === 'loading') {
		return <Loader />;
	}

	// Session exists (e.g. user navigated back to landing while logged in)
	if (session) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-slate-400">{t('auth.welcomeBack', { name: session.user?.name })}</p>
				<button
					onClick={() => router.push('/dashboard')}
					className="w-full bg-brand-600 hover:bg-brand-500 text-white h-11 rounded-lg text-sm font-medium transition-colors cursor-pointer"
				>
					{t('auth.goToDashboard')}
				</button>
			</div>
		);
	}

	const inputClass = 'w-full bg-slate-800/50 border border-slate-700/50 text-slate-100 px-4 h-11 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40 focus:border-brand-500/40 placeholder:text-slate-600 transition-all';

	return (
		<div className="space-y-5">
			{/* OAuth buttons first */}
			<div className="grid grid-cols-2 gap-3">
				<button
					onClick={() => signIn('google')}
					className="flex items-center justify-center gap-2.5 h-11 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg text-sm text-slate-300 transition-all cursor-pointer"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
					</svg>
					Google
				</button>
				<button
					onClick={() => signIn('github')}
					className="flex items-center justify-center gap-2.5 h-11 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg text-sm text-slate-300 transition-all cursor-pointer"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
					</svg>
					GitHub
				</button>
			</div>

			{/* Separator */}
			<div className="flex items-center gap-4">
				<div className="flex-1 h-px bg-slate-800" />
				<span className="text-xs text-slate-600 uppercase tracking-wider">{t('auth.or')}</span>
				<div className="flex-1 h-px bg-slate-800" />
			</div>

			{/* Tabs */}
			<div className="flex gap-1 p-1 rounded-lg bg-slate-800/30">
				<button
					onClick={() => switchTab('login')}
					className={`flex-1 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
						tab === 'login'
							? 'bg-slate-800 text-slate-100 shadow-sm'
							: 'text-slate-500 hover:text-slate-400'
					}`}
				>
					{t('auth.tabLogin')}
				</button>
				<button
					onClick={() => switchTab('register')}
					className={`flex-1 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
						tab === 'register'
							? 'bg-slate-800 text-slate-100 shadow-sm'
							: 'text-slate-500 hover:text-slate-400'
					}`}
				>
					{t('auth.tabRegister')}
				</button>
			</div>

			{/* Banners */}
			{error && (
				<p className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 px-3 py-2.5 rounded-lg">{error}</p>
			)}
			{successMessage && (
				<p className="text-xs text-green-400 bg-green-500/5 border border-green-500/10 px-3 py-2.5 rounded-lg">{successMessage}</p>
			)}

			{/* Login form */}
			{tab === 'login' && (
				<form onSubmit={handleLogin} className="space-y-3">
					<input type="email" required placeholder={t('auth.emailPlaceholder')} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputClass} />
					<input type="password" required placeholder={t('auth.passwordPlaceholder')} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputClass} />
					<button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white h-11 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
						{loading ? t('auth.signingIn') : t('auth.signIn')}
					</button>
					<p className="text-center text-xs text-slate-600">
						{t('auth.noAccount')}{' '}
						<button type="button" onClick={() => switchTab('register')} className="text-brand-400 hover:text-brand-300 cursor-pointer">{t('auth.registerLink')}</button>
					</p>
				</form>
			)}

			{/* Register form */}
			{tab === 'register' && (
				<form onSubmit={handleRegister} className="space-y-3">
					<input type="text" required placeholder={t('auth.namePlaceholder')} value={registerName} onChange={(e) => setRegisterName(e.target.value)} className={inputClass} />
					<input type="email" required placeholder={t('auth.emailPlaceholder')} value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className={inputClass} />
					<input type="password" required minLength={8} placeholder={t('auth.passwordPlaceholder')} value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className={inputClass} />
					<input type="password" required minLength={8} placeholder={t('auth.confirmPasswordPlaceholder')} value={registerConfirm} onChange={(e) => setRegisterConfirm(e.target.value)} className={inputClass} />
					<button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 text-white h-11 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
						{loading ? t('auth.registering') : t('auth.createAccount')}
					</button>
					<p className="text-center text-xs text-slate-600">
						{t('auth.alreadyHaveAccount')}{' '}
						<button type="button" onClick={() => switchTab('login')} className="text-brand-400 hover:text-brand-300 cursor-pointer">{t('auth.signInLink')}</button>
					</p>
				</form>
			)}
		</div>
	);
};

export default AuthButton;

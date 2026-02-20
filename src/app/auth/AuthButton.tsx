'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Loader from '../components/Loader';

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.1, delayChildren: 0.1 },
	},
};

const fadeUp = {
	hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
	show: {
		opacity: 1,
		y: 0,
		filter: 'blur(0px)',
		transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
	},
};

const AuthButton = () => {
	const { t } = useTranslation();
	const { data: session, status } = useSession();
	const router = useRouter();

	if (status === 'loading') {
		return <Loader />;
	}

	if (session) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="space-y-4"
			>
				<p className="text-sm text-slate-400">{t('auth.welcomeBack', { name: session.user?.name })}</p>
				<motion.button
					whileTap={{ scale: 0.98 }}
					onClick={() => router.push('/dashboard')}
					className="w-full bg-brand-600 hover:bg-brand-500 text-white h-11 rounded-xl text-sm font-medium transition-colors cursor-pointer"
				>
					{t('auth.goToDashboard')}
				</motion.button>
			</motion.div>
		);
	}

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className="space-y-5"
		>
			{/* Google */}
			<motion.div variants={fadeUp}>
				<motion.button
					whileTap={{ scale: 0.97 }}
					onClick={() => signIn('google')}
					className="w-full flex items-center justify-center gap-3 h-12 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600/50 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
					</svg>
					{t('auth.continueWithGoogle', 'Continue with Google')}
				</motion.button>
			</motion.div>

			{/* GitHub */}
			<motion.div variants={fadeUp}>
				<motion.button
					whileTap={{ scale: 0.97 }}
					onClick={() => signIn('github')}
					className="w-full flex items-center justify-center gap-3 h-12 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600/50 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
					</svg>
					{t('auth.continueWithGithub', 'Continue with GitHub')}
				</motion.button>
			</motion.div>
		</motion.div>
	);
};

export default AuthButton;

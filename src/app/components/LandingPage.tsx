'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AuthButton from '../auth/AuthButton';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';

export default function LandingPage() {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
			{/* Interactive grid background with content as children */}
			<InteractiveGridPattern
				className="absolute inset-0 bg-slate-950"
				cellSize={54}
				glowColor="rgba(0, 166, 139, 0.35)"
				borderColor="rgba(71, 85, 105, 0.15)"
				proximity={120}
			>
				<div className="pointer-events-none flex flex-col min-h-screen">
					{/* Top bar */}
					<motion.nav
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
						className="pointer-events-auto flex items-center justify-between px-8 md:px-12 py-6"
					>
						<span className="text-lg font-bold tracking-widest text-slate-100 uppercase">Nokan</span>
						<span className="text-xs text-slate-600 tracking-wider uppercase hidden sm:block">{t('landing.openSource')}</span>
					</motion.nav>

					{/* Main content */}
					<main className="pointer-events-auto flex-1 flex items-center px-8 md:px-12 pb-12">
						<div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

							{/* Left - Hero */}
							<motion.div
								initial={{ opacity: 0, x: -40 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
								className="space-y-10"
							>
								<div className="space-y-6">
									<h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-100 leading-[0.95] tracking-tight">
										{t('landing.heroTitle1')}
										<br />
										<span className="text-transparent bg-clip-text bg-linear-to-r from-brand-400 to-brand-300">
											{t('landing.heroTitle2')}
										</span>
									</h1>
									<p className="text-lg text-slate-400 max-w-md leading-relaxed">
										{t('landing.subtitle')}
									</p>
								</div>

								{/* Features - minimal list */}
								<div className="flex flex-col gap-4">
									{[
										{ label: t('landing.featureKanban'), desc: t('landing.featureKanbanDesc') },
										{ label: t('landing.featureTeam'), desc: t('landing.featureTeamDesc') },
										{ label: t('landing.featureFast'), desc: t('landing.featureFastDesc') },
									].map((f, i) => (
										<motion.div
											key={i}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
											className="flex items-start gap-4 group"
										>
											<span className="text-xs font-mono text-slate-600 mt-1 shrink-0">0{i + 1}</span>
											<div>
												<span className="text-sm font-medium text-slate-200 group-hover:text-brand-400 transition-colors">
													{f.label}
												</span>
												<span className="text-sm text-slate-500 ml-2">
													- {f.desc}
												</span>
											</div>
										</motion.div>
									))}
								</div>
							</motion.div>

							{/* Right - Auth card */}
							<motion.div
								initial={{ opacity: 0, y: 30, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
								className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
							>
								<div className="relative group rounded-2xl">
									{/* Ambient glow behind card */}
									<div className="absolute -inset-8 rounded-3xl bg-brand-500/[0.07] blur-3xl group-hover:bg-brand-500/[0.12] transition-all duration-1000 pointer-events-none" />
									<div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-800/50 group-hover:border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-black/30 transition-colors duration-700">
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 0.5, duration: 0.5 }}
											className="relative text-[10px] uppercase tracking-[0.25em] text-slate-500 font-medium mb-7"
										>
											{t('landing.getStarted')}
										</motion.p>
										<div className="relative">
											<AuthButton />
										</div>
									</div>
								</div>
							</motion.div>
						</div>
					</main>

					{/* Footer */}
					<motion.footer
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8, duration: 0.5 }}
						className="pointer-events-auto px-8 md:px-12 py-6 flex items-center justify-between border-t border-slate-800/50"
					>
						<span className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Nokan</span>
						<span className="text-xs text-slate-600">{t('landing.tagline').replace(/<\/?1>/g, '')}</span>
					</motion.footer>
				</div>
			</InteractiveGridPattern>
		</div>
	);
}

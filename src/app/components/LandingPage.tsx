'use client';

import { useTranslation } from 'react-i18next';
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
					<nav className="pointer-events-auto flex items-center justify-between px-8 md:px-12 py-6">
						<span className="text-lg font-bold tracking-widest text-slate-100 uppercase">Nokan</span>
						<span className="text-xs text-slate-600 tracking-wider uppercase hidden sm:block">{t('landing.openSource')}</span>
					</nav>

					{/* Main content */}
					<main className="pointer-events-auto flex-1 flex items-center px-8 md:px-12 pb-12">
						<div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

							{/* Left - Hero */}
							<div className="space-y-10">
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
										<div key={i} className="flex items-start gap-4 group">
											<span className="text-xs font-mono text-slate-600 mt-1 shrink-0">0{i + 1}</span>
											<div>
												<span className="text-sm font-medium text-slate-200 group-hover:text-brand-400 transition-colors">
													{f.label}
												</span>
												<span className="text-sm text-slate-500 ml-2">
													- {f.desc}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Right - Auth card */}
							<div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
								<div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/20">
									<p className="text-xs uppercase tracking-widest text-slate-500 mb-6">{t('landing.getStarted')}</p>
									<AuthButton />
								</div>
							</div>
						</div>
					</main>

					{/* Footer */}
					<footer className="pointer-events-auto px-8 md:px-12 py-6 flex items-center justify-between border-t border-slate-800/50">
						<span className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Nokan</span>
						<span className="text-xs text-slate-600">{t('landing.tagline').replace(/<\/?1>/g, '')}</span>
					</footer>
				</div>
			</InteractiveGridPattern>
		</div>
	);
}

'use client';

import { useState, useEffect } from 'react';
import { usePWASplash } from '../context/PWASplashContext';
import { useTranslation } from 'react-i18next';

interface LoaderProps {
     text?: string;
}

const Loader = ({ text }: LoaderProps) => {
     const { t } = useTranslation();
     const displayText = text ?? t('common.loading');
     const { isSplashActive } = usePWASplash();
     // Short delay before showing loader so the PWA splash has time to
     // activate after standalone detection (avoids a brief loader flash).
     const [visible, setVisible] = useState(false);

     useEffect(() => {
          const timer = setTimeout(() => setVisible(true), 150);
          return () => clearTimeout(timer);
     }, []);

     if (isSplashActive || !visible) return null;

     return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 select-none animate-[fadeIn_0.3s_ease-out]">
               {/* Ambient background glow */}
               <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/[0.05] blur-2xl animate-pulse" />
               </div>

               <div className="relative flex flex-col items-center gap-8">
                    {/* Orbital spinner */}
                    <div className="relative w-16 h-16">
                         {/* Outer ring */}
                         <div className="absolute inset-0 rounded-full border border-slate-700/50" />

                         {/* Spinning arc — primary */}
                         <svg className="absolute inset-0 w-16 h-16 animate-spin" viewBox="0 0 64 64" style={{ animationDuration: '1.4s' }}>
                              <circle
                                   cx="32"
                                   cy="32"
                                   r="30"
                                   fill="none"
                                   stroke="url(#loader-gradient)"
                                   strokeWidth="2"
                                   strokeLinecap="round"
                                   strokeDasharray="140 60"
                              />
                              <defs>
                                   <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                   </linearGradient>
                              </defs>
                         </svg>

                         {/* Counter-rotating inner arc */}
                         <svg
                              className="absolute inset-2 w-12 h-12"
                              viewBox="0 0 48 48"
                              style={{ animation: 'spin 2s linear infinite reverse' }}
                         >
                              <circle
                                   cx="24"
                                   cy="24"
                                   r="22"
                                   fill="none"
                                   stroke="url(#loader-gradient-inner)"
                                   strokeWidth="1.5"
                                   strokeLinecap="round"
                                   strokeDasharray="80 58"
                              />
                              <defs>
                                   <linearGradient id="loader-gradient-inner" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                   </linearGradient>
                              </defs>
                         </svg>

                         {/* Center dot pulse */}
                         <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-400/80 animate-pulse" />
                         </div>
                    </div>

                    {/* Text */}
                    <div className="flex flex-col items-center gap-2">
                         <p className="text-sm font-medium text-slate-300 tracking-widest uppercase">{displayText}</p>
                         <div className="flex items-center gap-1">
                              {[0, 1, 2].map((i) => (
                                   <span
                                        key={i}
                                        className="block w-1 h-1 rounded-full bg-slate-500"
                                        style={{
                                             animation: 'loaderDot 1.4s ease-in-out infinite',
                                             animationDelay: `${i * 0.2}s`,
                                        }}
                                   />
                              ))}
                         </div>
                    </div>
               </div>

               <style>{`
                    @keyframes loaderDot {
                         0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
                         40% { opacity: 1; transform: scale(1.5); }
                    }
                    @keyframes fadeIn {
                         from { opacity: 0; }
                         to { opacity: 1; }
                    }
               `}</style>
          </div>
     );
};

export default Loader;

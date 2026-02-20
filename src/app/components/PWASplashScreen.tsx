'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWASplash } from '../context/PWASplashContext';

const LETTERS = 'NOKAN'.split('');

const RINGS = [
     { size: 280, color: 'splash-gradient-outer', speed: 20, dash: '8 24', width: 1.5, delay: 0.2 },
     { size: 200, color: 'splash-gradient-mid', speed: 15, dash: '12 18', width: 1, delay: 0.4 },
     { size: 130, color: 'splash-gradient-inner', speed: 25, dash: '6 14', width: 0.75, delay: 0.6 },
];

export default function PWASplashScreen() {
     const { isSplashActive, dismissSplash } = usePWASplash();

     if (!isSplashActive) return null;

     return (
          <AnimatePresence>
               {isSplashActive && (
                    <motion.div
                         className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                         style={{ backgroundColor: '#0E172B' }}
                         initial={{ opacity: 1 }}
                         exit={{ opacity: 0, scale: 1.02 }}
                         transition={{ duration: 0.5, ease: 'easeInOut' }}
                         onAnimationComplete={() => {}}
                    >
                         {/* SVG Gradient Definitions */}
                         <svg className="absolute h-0 w-0" aria-hidden="true">
                              <defs>
                                   <linearGradient id="splash-gradient-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00a68b" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#00a68b" stopOpacity="0" />
                                   </linearGradient>
                                   <linearGradient id="splash-gradient-mid" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00a68b" stopOpacity="0.7" />
                                        <stop offset="100%" stopColor="#00a68b" stopOpacity="0" />
                                   </linearGradient>
                                   <linearGradient id="splash-gradient-inner" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#2ad4ab" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#2ad4ab" stopOpacity="0" />
                                   </linearGradient>
                              </defs>
                         </svg>

                         {/* Ambient Glows */}
                         <motion.div
                              className="pointer-events-none absolute inset-0"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.4 }}
                         >
                              <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/[0.07] blur-[100px]" />
                              <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-[40%] -translate-y-[60%] rounded-full bg-brand-500/[0.05] blur-[80px]" />
                              <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-[60%] -translate-y-[40%] rounded-full bg-brand-500/[0.04] blur-[60px]" />
                         </motion.div>

                         {/* Orbital Rings */}
                         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                              {RINGS.map((ring, i) => (
                                   <motion.div
                                        key={i}
                                        className="absolute left-1/2 top-1/2"
                                        style={{
                                             width: ring.size,
                                             height: ring.size,
                                             marginLeft: -ring.size / 2,
                                             marginTop: -ring.size / 2,
                                        }}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                             delay: ring.delay,
                                             duration: 0.6,
                                             ease: [0.16, 1, 0.3, 1],
                                        }}
                                   >
                                        <motion.svg
                                             viewBox={`0 0 ${ring.size} ${ring.size}`}
                                             className="h-full w-full"
                                             animate={{ rotate: 360 }}
                                             transition={{
                                                  duration: ring.speed,
                                                  repeat: Infinity,
                                                  ease: 'linear',
                                             }}
                                        >
                                             <circle
                                                  cx={ring.size / 2}
                                                  cy={ring.size / 2}
                                                  r={ring.size / 2 - 2}
                                                  fill="none"
                                                  stroke={`url(#${ring.color})`}
                                                  strokeWidth={ring.width}
                                                  strokeDasharray={ring.dash}
                                                  strokeLinecap="round"
                                             />
                                        </motion.svg>
                                   </motion.div>
                              ))}
                         </div>

                         {/* Logo + Tagline */}
                         <div className="relative z-10 flex flex-col items-center gap-3">
                              {/* NOKAN Letters */}
                              <div className="flex" aria-label="NOKAN">
                                   {LETTERS.map((letter, i) => (
                                        <motion.span
                                             key={i}
                                             className="bg-gradient-to-r from-white via-brand-100 to-brand-300 bg-clip-text text-5xl font-black tracking-[0.2em] text-transparent sm:text-6xl"
                                             initial={{ opacity: 0, y: 20 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             transition={{
                                                  delay: 0.6 + i * 0.08,
                                                  duration: 0.5,
                                                  ease: [0.16, 1, 0.3, 1],
                                             }}
                                        >
                                             {letter}
                                        </motion.span>
                                   ))}
                              </div>

                              {/* Shimmer Effect */}
                              <motion.div
                                   className="absolute left-0 top-0 h-full w-full overflow-hidden"
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: [0, 1, 0] }}
                                   transition={{ delay: 1.2, duration: 0.8, ease: 'easeInOut' }}
                              >
                                   <motion.div
                                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '400%' }}
                                        transition={{ delay: 1.2, duration: 0.8, ease: 'easeInOut' }}
                                   />
                              </motion.div>

                              {/* Tagline */}
                              <motion.span
                                   className="text-sm font-medium tracking-[0.3em] text-slate-400"
                                   initial={{ opacity: 0, filter: 'blur(8px)' }}
                                   animate={{ opacity: 1, filter: 'blur(0px)' }}
                                   transition={{ delay: 1.2, duration: 0.6, ease: 'easeOut' }}
                              >
                                   TASKBOARD
                              </motion.span>
                         </div>

                         {/* Auto-dismiss after animation completes */}
                         <motion.div
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              transition={{ delay: 2.5, duration: 0.5 }}
                              onAnimationComplete={() => dismissSplash()}
                         />
                    </motion.div>
               )}
          </AnimatePresence>
     );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePWASplash } from '../context/PWASplashContext';

export default function PWASplashScreen() {
     const { isSplashActive, dismissSplash } = usePWASplash();

     if (!isSplashActive) return null;

     return (
          <AnimatePresence>
               {isSplashActive && (
                    <motion.div
                         className="fixed inset-0 z-[9999] flex items-center justify-center"
                         style={{ backgroundColor: '#0E172B' }}
                         initial={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                         <div className="flex flex-col items-center gap-6">
                              {/* Logo */}
                              <motion.img
                                   src="/logo.svg"
                                   alt="Nokan"
                                   className="w-16 h-16"
                                   initial={{ opacity: 0, scale: 0.8 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              />

                         </div>

                         {/* Auto-dismiss */}
                         <motion.div
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              transition={{ delay: 1.8, duration: 0.3 }}
                              onAnimationComplete={() => dismissSplash()}
                         />
                    </motion.div>
               )}
          </AnimatePresence>
     );
}

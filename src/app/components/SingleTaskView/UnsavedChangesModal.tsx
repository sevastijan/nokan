import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiSave } from 'react-icons/fi';

interface UnsavedChangesModalProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirmExit: () => void;
     onSaveAndExit: () => void;
     isSaving: boolean;
}

export const UnsavedChangesModal = ({ isOpen, onClose, onConfirmExit, onSaveAndExit, isSaving }: UnsavedChangesModalProps) => {
     if (!isOpen) return null;

     return (
          <AnimatePresence>
               <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4"
                    onClick={onClose}
               >
                    <motion.div
                         initial={{ scale: 0.95, opacity: 0, y: 10 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.95, opacity: 0, y: 10 }}
                         transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                         className="bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/40 border border-amber-500/30"
                         onClick={(e) => e.stopPropagation()}
                    >
                         <div className="flex items-start gap-4 mb-5">
                              <div className="p-3 rounded-xl bg-amber-500/15">
                                   <FiAlertTriangle className="w-6 h-6 text-amber-400" />
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                   <h3 className="text-lg font-semibold text-white mb-1">Niezapisane zmiany</h3>
                                   <p className="text-slate-400 text-sm leading-relaxed">
                                        Masz niezapisane zmiany w zadaniu. Czy chcesz je zapisać przed zamknięciem?
                                   </p>
                              </div>
                         </div>
                         <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                              <motion.button
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                                   onClick={onConfirmExit}
                                   className="flex items-center justify-center gap-2 px-4 py-2.5 text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 text-sm font-medium"
                              >
                                   <FiX className="w-4 h-4" />
                                   Wyjdź bez zapisu
                              </motion.button>
                              <motion.button
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                                   onClick={onSaveAndExit}
                                   disabled={isSaving}
                                   className="flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   {isSaving ? (
                                        <>
                                             <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                  <path
                                                       className="opacity-75"
                                                       fill="currentColor"
                                                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                  />
                                             </svg>
                                             Zapisywanie...
                                        </>
                                   ) : (
                                        <>
                                             <FiSave className="w-4 h-4" />
                                             Zapisz i wyjdź
                                        </>
                                   )}
                              </motion.button>
                         </div>
                    </motion.div>
               </motion.div>
          </AnimatePresence>
     );
};

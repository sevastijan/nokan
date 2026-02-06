'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';

interface TaskCompletionModalProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirm: () => void;
     taskTitle: string;
}

const TaskCompletionModal = ({ isOpen, onClose, onConfirm, taskTitle }: TaskCompletionModalProps) => {
     return (
          <AnimatePresence>
               {isOpen && (
                    <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.2 }}
                         className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                         onClick={onClose}
                    >
                         <motion.div
                              initial={{ scale: 0.95, opacity: 0, y: 20 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.95, opacity: 0, y: 20 }}
                              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-gradient-to-b from-slate-800 to-slate-850 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/50 max-w-md w-full overflow-hidden"
                         >
                              {/* Header */}
                              <div className="px-6 py-5 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
                                             <FiCheck className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                             <h3 className="text-lg font-semibold text-white">Oznaczyć jako zakończone?</h3>
                                             <p className="text-xs text-slate-500 mt-0.5">Przeniesiono do kolumny Done</p>
                                        </div>
                                   </div>
                                   <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700/60 transition-all duration-200 text-slate-500 hover:text-slate-300" aria-label="Zamknij">
                                        <FiX className="w-5 h-5" />
                                   </button>
                              </div>

                              {/* Body */}
                              <div className="px-6 pb-5">
                                   <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                                        <p className="text-sm text-slate-400 mb-1">Zadanie</p>
                                        <p className="text-white font-medium truncate">{taskTitle || 'Zadanie bez tytułu'}</p>
                                   </div>
                              </div>

                              {/* Footer */}
                              <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50 flex items-center justify-end gap-3">
                                   <button
                                        onClick={onClose}
                                        className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
                                   >
                                        Zostaw bez zmian
                                   </button>
                                   <button
                                        onClick={onConfirm}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200"
                                   >
                                        Oznacz jako zakończone
                                   </button>
                              </div>
                         </motion.div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
};

export default TaskCompletionModal;

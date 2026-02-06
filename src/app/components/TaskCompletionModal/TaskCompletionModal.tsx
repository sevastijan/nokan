'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import Button from '../Button/Button';

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
                         className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100 p-4"
                         onClick={onClose}
                    >
                         <motion.div
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.95, opacity: 0 }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-800 rounded-xl shadow-2xl border border-slate-600 max-w-md w-full overflow-hidden"
                         >
                              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                             <FiCheckCircle className="w-5 h-5 text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Oznaczyć jako zakończone?</h3>
                                   </div>
                                   <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white" aria-label="Close">
                                        <FiX className="w-5 h-5" />
                                   </button>
                              </div>

                              <div className="px-6 py-4">
                                   <p className="text-slate-300 mb-2">
                                        Zadanie zostało przeniesione do kolumny <span className="font-semibold text-white">&quot;Done&quot;</span>.
                                   </p>
                                   <p className="text-slate-400 text-sm mb-4">Czy chcesz oznaczyć to zadanie jako zakończone?</p>
                                   <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                                        <p className="text-white font-medium truncate">{taskTitle || 'Zadanie bez tytułu'}</p>
                                   </div>
                              </div>

                              <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700 flex items-center justify-end gap-3">
                                   <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">
                                        Nie, zostaw bez zmian
                                   </Button>
                                   <Button variant="primary" onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white">
                                        Tak, oznacz jako zakończone
                                   </Button>
                              </div>
                         </motion.div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
};

export default TaskCompletionModal;

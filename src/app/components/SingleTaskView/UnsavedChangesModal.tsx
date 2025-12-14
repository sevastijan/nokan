import { motion, AnimatePresence } from 'framer-motion';
import Button from '../Button/Button';

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
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-60" onClick={onClose}>
                    <motion.div
                         initial={{ scale: 0.9 }}
                         animate={{ scale: 1 }}
                         exit={{ scale: 0.9 }}
                         className="bg-slate-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-500"
                         onClick={(e) => e.stopPropagation()}
                    >
                         <h3 className="text-xl font-semibold text-white mb-3">Niezapisane zmiany</h3>
                         <p className="text-slate-300 mb-6">Masz niezapisane zmiany w zadaniu. Czy chcesz je zapisać przed zamknięciem?</p>
                         <div className="flex justify-end gap-3">
                              <Button variant="ghost" onClick={onConfirmExit} className="text-slate-300 hover:text-white">
                                   Wyjdź bez zapisu
                              </Button>
                              <Button variant="primary" onClick={onSaveAndExit} disabled={isSaving}>
                                   {isSaving ? 'Zapisywanie...' : 'Zapisz i wyjdź'}
                              </Button>
                         </div>
                    </motion.div>
               </motion.div>
          </AnimatePresence>
     );
};

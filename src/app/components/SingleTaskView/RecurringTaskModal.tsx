'use client';

import { motion } from 'framer-motion';
import Button from '../Button/Button';
import ColumnSelector from '@/app/components/ColumnSelector';
import { FaTimes, FaRedo } from 'react-icons/fa';
import { Column } from '@/app/types/globalTypes';

interface RecurringTaskModalProps {
     isOpen: boolean;
     onClose: () => void;
     isRecurring: boolean;
     onToggleRecurring: (value: boolean) => void;
     recurrenceInterval: number;
     onChangeInterval: (value: number) => void;
     recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly';
     onChangeType: (value: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
     recurrenceColumnId: string | null | undefined;
     currentColumnId: string | undefined;
     onChangeColumn: (colId: string) => void;
     columns: Column[];
}

const RecurringTaskModal = ({
     isOpen,
     onClose,
     isRecurring,
     onToggleRecurring,
     recurrenceInterval,
     onChangeInterval,
     recurrenceType,
     onChangeType,
     recurrenceColumnId,
     currentColumnId,
     onChangeColumn,
     columns,
}: RecurringTaskModalProps) => {
     if (!isOpen) return null;

     return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-70" onClick={onClose}>
               <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-600"
                    onClick={(e) => e.stopPropagation()}
               >
                    <div className="flex items-center justify-between mb-5">
                         <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                              <FaRedo className="text-purple-400" />
                              Zadanie cykliczne
                         </h3>
                         <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                              <FaTimes className="w-5 h-5" />
                         </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                         <input
                              type="checkbox"
                              id="recurring-toggle"
                              checked={isRecurring}
                              onChange={(e) => onToggleRecurring(e.target.checked)}
                              className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500 cursor-pointer"
                         />
                         <label htmlFor="recurring-toggle" className="text-white font-medium cursor-pointer">
                              Włącz powtarzanie zadania
                         </label>
                    </div>

                    {isRecurring && (
                         <div className="space-y-5">
                              <div>
                                   <label className="block text-sm font-medium text-slate-300 mb-2">Powtarzaj co</label>
                                   <div className="flex gap-3">
                                        <input
                                             type="number"
                                             min="1"
                                             value={recurrenceInterval}
                                             onChange={(e) => onChangeInterval(parseInt(e.target.value) || 1)}
                                             className="w-24 px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <select
                                             value={recurrenceType}
                                             onChange={(e) => onChangeType(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                                             className="flex-1 px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                             <option value="daily">dzień/dni</option>
                                             <option value="weekly">tydzień/tygodni</option>
                                             <option value="monthly">miesiąc/miesiące</option>
                                             <option value="yearly">rok/lat</option>
                                        </select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-slate-300 mb-2">Nowa instancja w kolumnie</label>
                                   <ColumnSelector columns={columns} value={recurrenceColumnId || currentColumnId || columns[0]?.id || ''} onChange={onChangeColumn} />
                              </div>
                         </div>
                    )}

                    <div className="mt-6 flex justify-end">
                         <Button variant="primary" onClick={onClose}>
                              Gotowe
                         </Button>
                    </div>
               </motion.div>
          </motion.div>
     );
};

export default RecurringTaskModal;

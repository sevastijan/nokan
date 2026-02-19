'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiChevronDown, FiColumns } from 'react-icons/fi';
import type { Column } from '@/app/types/globalTypes';

interface ColumnSelectorProps {
     columns: Column[];
     value?: string;
     onChange: (columnId: string) => void;
     label?: string;
     disabled?: boolean;
}

const ColumnSelector = ({ columns, value, onChange, label, disabled = false }: ColumnSelectorProps) => {
     const { t } = useTranslation();
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!open) return;
          const handleClickOutside = (e: MouseEvent) => {
               if (ref.current && !ref.current.contains(e.target as Node)) {
                    setOpen(false);
               }
          };
          const handleEsc = (e: KeyboardEvent) => {
               if (e.key === 'Escape') {
                    setOpen(false);
               }
          };
          document.addEventListener('mousedown', handleClickOutside);
          document.addEventListener('keydown', handleEsc);
          return () => {
               document.removeEventListener('mousedown', handleClickOutside);
               document.removeEventListener('keydown', handleEsc);
          };
     }, [open]);

     if (disabled || !Array.isArray(columns) || columns.length === 0) {
          return (
               <div className="relative w-full">
                    {label && <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>}
                    <div className="w-full px-3 py-2.5 min-h-[46px] bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-500 text-sm flex items-center">
                         {columns.length === 0 ? t('column.noColumns') : t('common.disabled')}
                    </div>
               </div>
          );
     }

     const selected = columns.find((c) => c.id === value) || columns[0];

     return (
          <div ref={ref} className="relative w-full">
               {label && <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>}
               <button
                    type="button"
                    className={`
                         w-full flex items-center justify-between px-3 py-2 min-h-[46px]
                         bg-slate-700/50 border rounded-lg text-slate-200
                         transition-all duration-200
                         ${open ? 'border-purple-500/50 ring-2 ring-purple-500/50 bg-slate-700/70' : 'border-slate-600/50 hover:border-slate-500'}
                    `}
                    onClick={() => setOpen((v) => !v)}
               >
                    <span className="flex items-center gap-2.5 min-w-0">
                         <FiColumns className="w-4 h-4 text-slate-400" />
                         <span className="truncate text-sm font-medium">{selected.title}</span>
                    </span>
                    <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-2 shrink-0">
                         <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </motion.div>
               </button>
               <AnimatePresence>
                    {open && (
                         <motion.ul
                              initial={{ opacity: 0, y: -5, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 right-0 mt-2 z-50 rounded-xl bg-slate-800 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/40 py-1 overflow-auto thin-scrollbar"
                              role="listbox"
                              style={{ maxHeight: '15rem' }}
                         >
                              {columns.map((col) => {
                                   const isSelected = value === col.id;
                                   return (
                                        <li key={col.id}>
                                             <button
                                                  type="button"
                                                  className={`
                                                       w-full flex items-center px-3 py-2.5 text-left gap-2.5
                                                       transition-all duration-150
                                                       ${isSelected ? 'bg-purple-500/15' : 'hover:bg-slate-700/50'}
                                                  `}
                                                  onClick={() => {
                                                       onChange(col.id);
                                                       setOpen(false);
                                                  }}
                                                  role="option"
                                                  aria-selected={isSelected}
                                             >
                                                  <FiColumns className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                                                  <span className={`flex-1 truncate text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                       {col.title}
                                                  </span>
                                                  {isSelected && <FiCheck className="w-4 h-4 text-purple-400 stroke-[3]" />}
                                             </button>
                                        </li>
                                   );
                              })}
                         </motion.ul>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default ColumnSelector;

'use client';

import { useRef, useMemo, useCallback } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import FilterRadioItem from './FilterRadioItem';
import Avatar from '@/app/components/Avatar/Avatar';
import type { TaskTypeFilter } from '@/app/types/globalTypes';

export interface PriorityOption {
     id: string;
     label: string;
     color: string;
}

export interface AssigneeOption {
     id: string;
     name: string;
     image?: string;
}

interface FilterDropdownProps {
     isOpen: boolean;
     onToggle: () => void;
     onClose: () => void;
     priorities: PriorityOption[];
     filterPriority: string | null;
     onFilterPriorityChange: (priorityId: string | null) => void;
     assignees: AssigneeOption[];
     filterAssignee: string | null;
     onFilterAssigneeChange: (assigneeId: string | null) => void;
     filterType: TaskTypeFilter;
     onFilterTypeChange?: (type: TaskTypeFilter) => void;
}

const FilterDropdown = ({
     isOpen,
     onToggle,
     onClose,
     priorities,
     filterPriority,
     onFilterPriorityChange,
     assignees,
     filterAssignee,
     onFilterAssigneeChange,
     filterType,
     onFilterTypeChange,
}: FilterDropdownProps) => {
     const containerRef = useRef<HTMLDivElement>(null);

     useOutsideClick([containerRef], onClose, isOpen);

     const hasActiveFilters = useMemo(
          () => filterPriority !== null || filterAssignee !== null || filterType !== 'all',
          [filterPriority, filterAssignee, filterType],
     );

     const activeFiltersCount = useMemo(() => {
          let count = 0;
          if (filterPriority !== null) count++;
          if (filterAssignee !== null) count++;
          if (filterType !== 'all') count++;
          return count;
     }, [filterPriority, filterAssignee, filterType]);

     const handleClearFilters = useCallback(() => {
          onFilterPriorityChange(null);
          onFilterAssigneeChange(null);
          onFilterTypeChange?.('all');
     }, [onFilterPriorityChange, onFilterAssigneeChange, onFilterTypeChange]);

     return (
          <div className="relative" ref={containerRef}>
               <button
                    onClick={onToggle}
                    className={`
                         flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                         ${hasActiveFilters || isOpen ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
                    `}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
               >
                    <FiFilter className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Filtry</span>
                    {hasActiveFilters && <span className="bg-slate-500 text-slate-100 text-xs px-1.5 py-0.5 rounded min-w-[18px] text-center">{activeFiltersCount}</span>}
               </button>

               <AnimatePresence>
                    {isOpen && (
                         <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 overflow-hidden"
                         >
                              {/* Header */}
                              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                                   <span className="text-sm font-medium text-slate-200">Filtruj zadania</span>
                                   {hasActiveFilters && (
                                        <button onClick={handleClearFilters} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                                             Wyczyść
                                        </button>
                                   )}
                              </div>

                              <div className="p-3 space-y-4 max-h-[60vh] overflow-y-auto">
                                   {/* Priority Filter */}
                                   <div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">Priorytet</div>
                                        <ul className="space-y-0.5">
                                             <li>
                                                  <FilterRadioItem name="filter-priority" checked={filterPriority === null} onChange={() => onFilterPriorityChange(null)}>
                                                       <span className="text-sm text-slate-300">Wszystkie</span>
                                                  </FilterRadioItem>
                                             </li>
                                             {priorities.map((p) => (
                                                  <li key={p.id}>
                                                       <FilterRadioItem name="filter-priority" checked={filterPriority === p.id} onChange={() => onFilterPriorityChange(p.id)}>
                                                            <div className="flex items-center gap-2">
                                                                 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                 <span className="text-sm text-slate-300">{p.label}</span>
                                                            </div>
                                                       </FilterRadioItem>
                                                  </li>
                                             ))}
                                        </ul>
                                   </div>

                                   <div className="border-t border-slate-700/50" />

                                   {/* Assignee Filter */}
                                   <div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">Przypisani</div>
                                        <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                                             <li>
                                                  <FilterRadioItem name="filter-assignee" checked={filterAssignee === null} onChange={() => onFilterAssigneeChange(null)}>
                                                       <span className="text-sm text-slate-300">Wszyscy</span>
                                                  </FilterRadioItem>
                                             </li>
                                             {assignees.map((u) => (
                                                  <li key={u.id}>
                                                       <FilterRadioItem name="filter-assignee" checked={filterAssignee === u.id} onChange={() => onFilterAssigneeChange(u.id)}>
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                 <Avatar src={u.image || ''} alt={u.name} size={20} className="shrink-0" />
                                                                 <span className="text-sm text-slate-300 truncate">{u.name}</span>
                                                            </div>
                                                       </FilterRadioItem>
                                                  </li>
                                             ))}
                                        </ul>
                                   </div>

                                   <div className="border-t border-slate-700/50" />

                                   {/* Task Type Filter */}
                                   <div>
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">Typ zadania</div>
                                        <div className="flex bg-slate-900/50 rounded-lg p-0.5">
                                             {(['all', 'task', 'story'] as TaskTypeFilter[]).map((t) => (
                                                  <button
                                                       key={t}
                                                       onClick={() => onFilterTypeChange?.(t)}
                                                       className={`
                                                            flex-1 py-1.5 text-xs font-medium rounded-md transition-colors
                                                            ${filterType === t ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}
                                                       `}
                                                  >
                                                       {t === 'all' ? 'Wszystkie' : t === 'task' ? 'Task' : 'Story'}
                                                  </button>
                                             ))}
                                        </div>
                                   </div>
                              </div>
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default FilterDropdown;

'use client';

import { useState, useRef, useEffect } from 'react';
import { FaFilter } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';

export interface PriorityOption {
     id: string;
     label: string;
     color: string;
}

export interface AssigneeOption {
     id: string;
     name: string;
}

interface FilterDropdownProps {
     priorities: PriorityOption[];
     assignees: AssigneeOption[];
     filterPriority: string | null;
     filterAssignee: string | null;
     onFilterPriorityChange: (priorityId: string | null) => void;
     onFilterAssigneeChange: (assigneeId: string | null) => void;
}

const FilterDropdown = ({ priorities, assignees, filterPriority, filterAssignee, onFilterPriorityChange, onFilterAssigneeChange }: FilterDropdownProps) => {
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);

     useOutsideClick([ref], () => {
          if (open) setOpen(false);
     });

     useEffect(() => {
          const handler = (e: KeyboardEvent) => {
               if (e.key === 'Escape' && open) {
                    setOpen(false);
               }
          };
          document.addEventListener('keydown', handler);
          return () => document.removeEventListener('keydown', handler);
     }, [open]);

     const hasActiveFilters = filterPriority !== null || filterAssignee !== null;
     const activeAssignee = assignees.find((a) => a.id === filterAssignee);

     return (
          <div className="relative" ref={ref}>
               <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                         <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                              {filterAssignee && activeAssignee && (
                                   <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                        <span className="text-xs font-medium text-blue-300">👤 {activeAssignee.name}</span>
                                        <button
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  onFilterAssigneeChange(null);
                                             }}
                                             className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
                                             title="Usuń filtr"
                                        >
                                             <FiX className="w-3 h-3 text-blue-300" />
                                        </button>
                                   </div>
                              )}
                              {filterPriority && (
                                   <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                        <span className="text-xs font-medium text-purple-300">🏷️ {priorities.find((p) => p.id === filterPriority)?.label || 'Priority'}</span>
                                        <button
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  onFilterPriorityChange(null);
                                             }}
                                             className="hover:bg-purple-500/30 rounded p-0.5 transition-colors"
                                             title="Usuń filtr"
                                        >
                                             <FiX className="w-3 h-3 text-purple-300" />
                                        </button>
                                   </div>
                              )}
                         </div>
                    )}

                    <button
                         type="button"
                         onClick={() => setOpen((o) => !o)}
                         className={clsx(
                              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                              open || hasActiveFilters ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-purple-200 hover:text-white hover:bg-purple-700/50 backdrop-blur-sm',
                         )}
                    >
                         <FaFilter className="w-4 h-4" />
                         <span className="hidden sm:inline text-sm font-medium">Filters</span>
                         {hasActiveFilters && (
                              <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">{(filterPriority ? 1 : 0) + (filterAssignee ? 1 : 0)}</span>
                         )}
                    </button>
               </div>

               {open && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl shadow-slate-900/50 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                         <div className="p-4 space-y-4">
                              <div>
                                   <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-white">Priority</h4>
                                        {filterPriority && (
                                             <button onClick={() => onFilterPriorityChange(null)} className="text-xs text-slate-400 hover:text-white transition-colors">
                                                  Clear
                                             </button>
                                        )}
                                   </div>
                                   <ul className="space-y-1.5 max-h-48 overflow-auto scrollbar-thin scrollbar-thumb-slate-600">
                                        <li>
                                             <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                  <input
                                                       type="radio"
                                                       name="filterPriority"
                                                       value=""
                                                       checked={filterPriority === null}
                                                       onChange={() => onFilterPriorityChange(null)}
                                                       className="form-radio text-purple-500 bg-slate-700 border-slate-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                                                  />
                                                  <span className="text-sm text-slate-300">All priorities</span>
                                             </label>
                                        </li>
                                        {priorities.map((p) => (
                                             <li key={p.id}>
                                                  <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                       <input
                                                            type="radio"
                                                            name="filterPriority"
                                                            value={p.id}
                                                            checked={filterPriority === p.id}
                                                            onChange={() => onFilterPriorityChange(p.id)}
                                                            className="form-radio text-purple-500 bg-slate-700 border-slate-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                                                       />
                                                       <span
                                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm"
                                                            style={{
                                                                 backgroundColor: p.color + '20',
                                                                 color: p.color,
                                                                 border: `1px solid ${p.color}40`,
                                                            }}
                                                       >
                                                            {p.label}
                                                       </span>
                                                  </label>
                                             </li>
                                        ))}
                                   </ul>
                              </div>

                              <hr className="border-slate-700/50" />
                              <div>
                                   <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-white">Assignee</h4>
                                        {filterAssignee && (
                                             <button onClick={() => onFilterAssigneeChange(null)} className="text-xs text-slate-400 hover:text-white transition-colors">
                                                  Clear
                                             </button>
                                        )}
                                   </div>
                                   <ul className="space-y-1.5 max-h-48 overflow-auto scrollbar-thin scrollbar-thumb-slate-600">
                                        <li>
                                             <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                  <input
                                                       type="radio"
                                                       name="filterAssignee"
                                                       value=""
                                                       checked={filterAssignee === null}
                                                       onChange={() => onFilterAssigneeChange(null)}
                                                       className="form-radio text-purple-500 bg-slate-700 border-slate-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                                                  />
                                                  <span className="text-sm text-slate-300">All assignees</span>
                                             </label>
                                        </li>
                                        {assignees.map((u) => (
                                             <li key={u.id}>
                                                  <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                       <input
                                                            type="radio"
                                                            name="filterAssignee"
                                                            value={u.id}
                                                            checked={filterAssignee === u.id}
                                                            onChange={() => onFilterAssigneeChange(u.id)}
                                                            className="form-radio text-purple-500 bg-slate-700 border-slate-600 focus:ring-purple-500 focus:ring-offset-slate-800"
                                                       />
                                                       <span className="text-sm text-slate-300 truncate">{u.name}</span>
                                                  </label>
                                             </li>
                                        ))}
                                   </ul>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default FilterDropdown;

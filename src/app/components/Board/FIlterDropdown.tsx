'use client';

import { useState, useRef, useEffect } from 'react';
import { FaFilter } from 'react-icons/fa';
import clsx from 'clsx';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';

export interface PriorityOption {
     id: string;
     label: string;
     color: string; // hex or tailwind color
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

/**
 * FilterDropdown: A dropdown to filter tasks by priority and assignee.
 * Features:
 * - Closes on outside click or when ESC is pressed.
 * - Lists all available priorities and assignees with radio inputs.
 * - Calls provided callbacks when filters are changed.
 */
const FilterDropdown = ({ priorities, assignees, filterPriority, filterAssignee, onFilterPriorityChange, onFilterAssigneeChange }: FilterDropdownProps) => {
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);

     useOutsideClick([ref], () => {
          if (open) setOpen(false);
     });

     // Close the dropdown when ESC key is pressed
     useEffect(() => {
          const handler = (e: KeyboardEvent) => {
               if (e.key === 'Escape' && open) {
                    setOpen(false);
               }
          };
          document.addEventListener('keydown', handler);
          return () => document.removeEventListener('keydown', handler);
     }, [open]);

     return (
          <div className="relative" ref={ref}>
               {/* Button that toggles the filter dropdown */}
               <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={clsx('flex items-center gap-1 px-3 py-2 rounded-md transition', open ? 'bg-purple-600 text-white' : 'text-purple-200 hover:text-white hover:bg-purple-700')}
               >
                    <FaFilter className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Filters</span>
               </button>

               {/* Dropdown content */}
               {open && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                         <div className="p-3 space-y-3">
                              {/* Priority filter section */}
                              <div>
                                   <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Priority</h4>
                                   <ul className="space-y-1 max-h-40 overflow-auto">
                                        {/* Option for all priorities */}
                                        <li>
                                             <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                                                  <input
                                                       type="radio"
                                                       name="filterPriority"
                                                       value=""
                                                       checked={filterPriority === null}
                                                       onChange={() => onFilterPriorityChange(null)}
                                                       className="form-radio text-purple-600"
                                                  />
                                                  <span>All</span>
                                             </label>
                                        </li>
                                        {/* List all priority options */}
                                        {priorities.map((p) => (
                                             <li key={p.id}>
                                                  <label className="flex items-center gap-2 text-sm">
                                                       <input
                                                            type="radio"
                                                            name="filterPriority"
                                                            value={p.id}
                                                            checked={filterPriority === p.id}
                                                            onChange={() => onFilterPriorityChange(p.id)}
                                                            className="form-radio text-purple-600"
                                                       />
                                                       <span
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                 backgroundColor: p.color,
                                                                 color: '#fff',
                                                            }}
                                                       >
                                                            {p.label}
                                                       </span>
                                                  </label>
                                             </li>
                                        ))}
                                   </ul>
                              </div>

                              <hr className="border-gray-200 dark:border-gray-700" />

                              {/* Assignee filter section */}
                              <div>
                                   <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Assignee</h4>
                                   <ul className="space-y-1 max-h-40 overflow-auto">
                                        {/* Option for all assignees */}
                                        <li>
                                             <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                                                  <input
                                                       type="radio"
                                                       name="filterAssignee"
                                                       value=""
                                                       checked={filterAssignee === null}
                                                       onChange={() => onFilterAssigneeChange(null)}
                                                       className="form-radio text-purple-600"
                                                  />
                                                  <span>All</span>
                                             </label>
                                        </li>
                                        {/* List all assignee options */}
                                        {assignees.map((u) => (
                                             <li key={u.id}>
                                                  <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                                                       <input
                                                            type="radio"
                                                            name="filterAssignee"
                                                            value={u.id}
                                                            checked={filterAssignee === u.id}
                                                            onChange={() => onFilterAssigneeChange(u.id)}
                                                            className="form-radio text-purple-600"
                                                       />
                                                       <span className="truncate">{u.name}</span>
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

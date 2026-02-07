'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ListChecks, SlidersHorizontal } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import { UserTaskItem } from './UserTaskItem';
import type { UserTask } from '@/app/store/endpoints/taskEndpoints';

type StatusFilter = 'all' | 'active' | 'completed';
type PriorityFilter = string | null;

interface UserTaskListProps {
     tasks: UserTask[];
     isLoading: boolean;
     onToggleComplete: (taskId: string, completed: boolean) => void;
}

export const UserTaskList = ({ tasks, isLoading, onToggleComplete }: UserTaskListProps) => {
     const [searchTerm, setSearchTerm] = useState('');
     const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
     const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(null);

     const filteredTasks = useMemo(() => {
          return tasks.filter((task) => {
               const matchesSearch = !searchTerm || task.title.toLowerCase().includes(searchTerm.toLowerCase());
               const matchesStatus =
                    statusFilter === 'all' ||
                    (statusFilter === 'active' && !task.completed) ||
                    (statusFilter === 'completed' && task.completed);
               const matchesPriority = !priorityFilter || task.priority_info?.label.toLowerCase() === priorityFilter;

               return matchesSearch && matchesStatus && matchesPriority;
          });
     }, [tasks, searchTerm, statusFilter, priorityFilter]);

     const uniquePriorities = useMemo(() => {
          const map = new Map<string, { label: string; color: string }>();
          tasks.forEach((t) => {
               if (t.priority_info) {
                    map.set(t.priority_info.label.toLowerCase(), {
                         label: t.priority_info.label,
                         color: t.priority_info.color,
                    });
               }
          });
          return Array.from(map.entries());
     }, [tasks]);

     const hasActiveFilters = searchTerm || statusFilter !== 'all' || priorityFilter;

     if (isLoading) {
          return (
               <div className="flex flex-col gap-3">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="h-14 bg-slate-800/40 border border-slate-700/30 rounded-xl animate-pulse" />
                    ))}
               </div>
          );
     }

     return (
          <div className="flex flex-col gap-4">
               {/* Toolbar */}
               <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    <div className="relative flex-1 sm:max-w-xs">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                         <input
                              type="text"
                              placeholder="Szukaj tasków..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 w-full placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                         />
                    </div>

                    {/* Status filter chips */}
                    <div className="flex items-center gap-1.5">
                         {(['all', 'active', 'completed'] as StatusFilter[]).map((status) => {
                              const labels: Record<StatusFilter, string> = {
                                   all: 'Wszystkie',
                                   active: 'Aktywne',
                                   completed: 'Ukończone',
                              };
                              const isActive = statusFilter === status;
                              return (
                                   <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                                             isActive
                                                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                                        }`}
                                   >
                                        {labels[status]}
                                   </button>
                              );
                         })}
                    </div>

                    {/* Priority filter */}
                    {uniquePriorities.length > 0 && (
                         <Popover className="relative">
                              {({ open }) => (
                                   <>
                                        <Popover.Button
                                             className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                                                  priorityFilter || open
                                                       ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                                       : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                                             }`}
                                        >
                                             <SlidersHorizontal className="w-3.5 h-3.5" />
                                             {priorityFilter
                                                  ? uniquePriorities.find(([key]) => key === priorityFilter)?.[1].label || 'Priorytet'
                                                  : 'Priorytet'}
                                        </Popover.Button>
                                        <Transition
                                             show={open}
                                             as="div"
                                             enter="transition ease-out duration-150"
                                             enterFrom="opacity-0 translate-y-1"
                                             enterTo="opacity-100 translate-y-0"
                                             leave="transition ease-in duration-100"
                                             leaveFrom="opacity-100 translate-y-0"
                                             leaveTo="opacity-0 translate-y-1"
                                        >
                                             <Popover.Panel className="absolute right-0 z-40 mt-2 w-40 bg-slate-800/95 border border-slate-700/50 rounded-lg shadow-xl p-2">
                                                  <button
                                                       onClick={() => setPriorityFilter(null)}
                                                       className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition ${
                                                            !priorityFilter ? 'bg-slate-700/50 text-white' : 'text-slate-300 hover:bg-slate-700/30'
                                                       }`}
                                                  >
                                                       Wszystkie
                                                  </button>
                                                  {uniquePriorities.map(([key, { label, color }]) => (
                                                       <button
                                                            key={key}
                                                            onClick={() => setPriorityFilter(key)}
                                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition flex items-center gap-2 ${
                                                                 priorityFilter === key ? 'bg-slate-700/50 text-white' : 'text-slate-300 hover:bg-slate-700/30'
                                                            }`}
                                                       >
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                            {label}
                                                       </button>
                                                  ))}
                                             </Popover.Panel>
                                        </Transition>
                                   </>
                              )}
                         </Popover>
                    )}
               </div>

               {/* Task list */}
               {filteredTasks.length > 0 ? (
                    <motion.div
                         className="flex flex-col gap-2"
                         initial="hidden"
                         animate="visible"
                         variants={{
                              visible: { transition: { staggerChildren: 0.04 } },
                         }}
                    >
                         <AnimatePresence mode="popLayout">
                              {filteredTasks.map((task) => (
                                   <UserTaskItem key={task.id} task={task} onToggleComplete={onToggleComplete} />
                              ))}
                         </AnimatePresence>
                    </motion.div>
               ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                         <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
                              <ListChecks className="w-10 h-10 text-slate-400" />
                         </div>
                         <h3 className="text-2xl font-semibold text-white mb-2">
                              {hasActiveFilters ? 'Nie znaleziono tasków' : 'Brak przypisanych tasków'}
                         </h3>
                         <p className="text-slate-400 text-center max-w-md mb-6">
                              {hasActiveFilters
                                   ? 'Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry'
                                   : 'Taski przypisane do Ciebie lub w których współpracujesz pojawią się tutaj'}
                         </p>
                         {hasActiveFilters && (
                              <button
                                   onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setPriorityFilter(null);
                                   }}
                                   className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-200 border border-slate-700 hover:border-slate-600 cursor-pointer"
                              >
                                   Wyczyść filtry
                              </button>
                         )}
                    </div>
               )}
          </div>
     );
};

'use client';

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, ClipboardList, Users, ArrowUpDown, X } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import Button from '@/app/components/Button/Button';

type SortOption = 'name' | 'tasks' | 'members' | 'newest' | 'custom';

interface DashboardToolbarProps {
     searchTerm: string;
     onSearchChange: (value: string) => void;
     hasTasksOnly: boolean;
     setHasTasksOnly: (value: boolean) => void;
     hasMembersOnly: boolean;
     setHasMembersOnly: (value: boolean) => void;
     sortBy: SortOption;
     setSortBy: (value: SortOption) => void;
     onClearFilters: () => void;
     onCreateClick: () => void;
}

export const DashboardToolbar = ({
     searchTerm,
     onSearchChange,
     hasTasksOnly,
     setHasTasksOnly,
     hasMembersOnly,
     setHasMembersOnly,
     sortBy,
     setSortBy,
     onClearFilters,
     onCreateClick,
}: DashboardToolbarProps) => {
     const { t } = useTranslation();
     const inputRef = useRef<HTMLInputElement>(null);
     const hasActiveFilters = searchTerm || hasTasksOnly || hasMembersOnly || sortBy !== 'newest';

     useEffect(() => {
          const handler = (e: KeyboardEvent) => {
               if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                    const tag = (e.target as HTMLElement)?.tagName;
                    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
                    e.preventDefault();
                    inputRef.current?.focus();
               }
               if (e.key === 'Escape') {
                    inputRef.current?.blur();
                    if (searchTerm) onSearchChange('');
               }
          };
          window.addEventListener('keydown', handler);
          return () => window.removeEventListener('keydown', handler);
     }, [searchTerm, onSearchChange]);

     const SORT_OPTIONS: { value: SortOption; label: string }[] = [
          { value: 'custom', label: 'Własna kolejność' },
          { value: 'newest', label: t('dashboard.newest') },
          { value: 'name', label: t('dashboard.nameAZ') },
          { value: 'tasks', label: t('dashboard.mostTasks') },
          { value: 'members', label: t('dashboard.mostMembers') },
     ];

     return (
          <div className="flex flex-col gap-4">
               {/* Search + New project row */}
               <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                         <input
                              ref={inputRef}
                              type="text"
                              placeholder={t('dashboard.searchProjects')}
                              value={searchTerm}
                              onChange={(e) => onSearchChange(e.target.value)}
                              className="w-full pl-12 pr-12 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition"
                         />
                         {searchTerm ? (
                              <button
                                   onClick={() => onSearchChange('')}
                                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                              >
                                   <X className="w-4 h-4" />
                              </button>
                         ) : (
                              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-800 border border-slate-700 rounded">
                                   /
                              </kbd>
                         )}
                    </div>
                    <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onCreateClick} className="shrink-0">
                         <span className="hidden sm:inline">{t('dashboard.newProject')}</span>
                         <span className="sm:hidden">Nowy</span>
                    </Button>
               </div>

               {/* Filters row */}
               <div className="flex flex-wrap gap-2 items-center">
                    <button
                         onClick={() => setHasTasksOnly(!hasTasksOnly)}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                              hasTasksOnly
                                   ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                                   : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                         }`}
                    >
                         <ClipboardList className="w-3.5 h-3.5" />
                         {t('dashboard.withTasks')}
                    </button>

                    <button
                         onClick={() => setHasMembersOnly(!hasMembersOnly)}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                              hasMembersOnly
                                   ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                                   : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                         }`}
                    >
                         <Users className="w-3.5 h-3.5" />
                         {t('dashboard.withTeam')}
                    </button>

                    <Popover className="relative">
                         {({ open, close }) => (
                              <>
                                   <Popover.Button
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                             sortBy !== 'newest' || open
                                                  ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                                                  : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                                        }`}
                                   >
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                        {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || t('dashboard.sort')}
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
                                        <Popover.Panel className="absolute left-0 z-40 mt-2 w-48 bg-slate-800/95 border border-slate-700/50 rounded-lg shadow-xl p-1.5">
                                             {SORT_OPTIONS.map((option) => (
                                                  <button
                                                       key={option.value}
                                                       onClick={() => {
                                                            setSortBy(option.value);
                                                            close();
                                                       }}
                                                       className={`w-full text-left px-3 py-2 text-xs rounded-md transition ${
                                                            sortBy === option.value
                                                                 ? 'bg-brand-500/15 text-brand-300'
                                                                 : 'text-slate-300 hover:bg-slate-700/40 hover:text-white'
                                                       }`}
                                                  >
                                                       {option.label}
                                                  </button>
                                             ))}
                                        </Popover.Panel>
                                   </Transition>
                              </>
                         )}
                    </Popover>

                    {hasActiveFilters && (
                         <button
                              onClick={onClearFilters}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 transition cursor-pointer"
                         >
                              <X className="w-3 h-3" />
                              Wyczyść
                         </button>
                    )}
               </div>
          </div>
     );
};

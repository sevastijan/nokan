'use client';

import { useTranslation } from 'react-i18next';
import { Search, Plus, ClipboardList, Users, ArrowUpDown } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import Button from '@/app/components/Button/Button';

type SortOption = 'name' | 'tasks' | 'members' | 'newest';

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
     onCreateClick,
}: DashboardToolbarProps) => {
     const { t } = useTranslation();

     const SORT_OPTIONS: { value: SortOption; label: string }[] = [
          { value: 'newest', label: t('dashboard.newest') },
          { value: 'name', label: t('dashboard.nameAZ') },
          { value: 'tasks', label: t('dashboard.mostTasks') },
          { value: 'members', label: t('dashboard.mostMembers') },
     ];

     return (
          <div className="flex flex-col gap-3">
               {/* Header row */}
               <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                         <h2 className="text-2xl font-bold text-white">{t('dashboard.yourProjects')}</h2>
                         <p className="text-slate-400 text-sm">{t('dashboard.manageProjects')}</p>
                    </div>
                    <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onCreateClick} className="w-full sm:w-auto">
                         {t('dashboard.newProject')}
                    </Button>
               </div>

               {/* Filters row */}
               <div className="flex flex-wrap gap-2.5 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                         <input
                              type="text"
                              placeholder={t('dashboard.searchProjects')}
                              value={searchTerm}
                              onChange={(e) => onSearchChange(e.target.value)}
                              className="pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 w-full placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                         />
                    </div>

                    {/* Quick filter: Has tasks */}
                    <button
                         onClick={() => setHasTasksOnly(!hasTasksOnly)}
                         className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                              hasTasksOnly
                                   ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                   : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                         }`}
                    >
                         <ClipboardList className="w-3.5 h-3.5" />
                         {t('dashboard.withTasks')}
                    </button>

                    {/* Quick filter: Has members */}
                    <button
                         onClick={() => setHasMembersOnly(!hasMembersOnly)}
                         className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                              hasMembersOnly
                                   ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                   : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-slate-200 hover:border-slate-600/50'
                         }`}
                    >
                         <Users className="w-3.5 h-3.5" />
                         {t('dashboard.withTeam')}
                    </button>

                    {/* Sort dropdown */}
                    <Popover className="relative">
                         {({ open, close }) => (
                              <>
                                   <Popover.Button
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                             sortBy !== 'newest' || open
                                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
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
                                                                 ? 'bg-purple-500/15 text-purple-300'
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
               </div>
          </div>
     );
};

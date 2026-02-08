'use client';

import { useState, useRef, useCallback, useMemo, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSearch, FiPlus, FiFileText, FiCode, FiX, FiCornerDownRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardHeaderProps } from '@/app/types/globalTypes';
import { useHasManagementAccess } from '@/app/hooks/useHasManagementAccess';
import FilterDropdown from './FilterDropdown';
import ViewModeToggle from './ViewModeToggle';
import MembersDropdown from './MembersDropdown';

interface ExtendedBoardHeaderProps extends BoardHeaderProps {
     boardId: string;
     currentUserId?: string;
     onOpenNotes: () => void;
     onOpenApiTokens?: () => void;
}

const BoardHeader = ({
     boardTitle,
     onTitleChange,
     onTitleBlur,
     onAddColumn,
     viewMode,
     onViewModeChange,
     searchTerm,
     onSearchChange,
     priorities,
     filterPriority,
     onFilterPriorityChange,
     assignees,
     filterAssignee,
     onFilterAssigneeChange,
     boardId,
     currentUserId,
     onOpenNotes,
     onOpenApiTokens,
     filterType,
     onFilterTypeChange,
     showSubtasks,
     onShowSubtasksChange,
}: ExtendedBoardHeaderProps) => {
     const router = useRouter();

     const [showMobileSearch, setShowMobileSearch] = useState(false);
     const [filterOpen, setFilterOpen] = useState(false);
     const [membersOpen, setMembersOpen] = useState(false);

     const searchInputRef = useRef<HTMLInputElement>(null);

     const hasManagementAccess = useHasManagementAccess();

     const handleBack = useCallback(() => router.push('/dashboard'), [router]);

     const handleSearchIconClick = useCallback(() => {
          setShowMobileSearch((p) => !p);
     }, []);

     const handleSearchInputChange = useCallback(
          (e: ChangeEvent<HTMLInputElement>) => {
               onSearchChange(e.target.value);
          },
          [onSearchChange],
     );

     const handleTitleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
               (e.target as HTMLInputElement).blur();
          }
     }, []);

     const handleFilterToggle = useCallback(() => {
          setFilterOpen((p) => !p);
          setMembersOpen(false);
     }, []);

     const handleFilterClose = useCallback(() => setFilterOpen(false), []);

     const handleMembersToggle = useCallback(() => {
          setMembersOpen((p) => !p);
          setFilterOpen(false);
     }, []);

     const handleMembersClose = useCallback(() => setMembersOpen(false), []);

     const handleCloseMobileSearch = useCallback(() => setShowMobileSearch(false), []);

     const hasActiveFilters = useMemo(() => filterPriority !== null || filterAssignee !== null || filterType !== 'all', [filterPriority, filterAssignee, filterType]);

     return (
          <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
               <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    {/* Top Row: Back button + Title */}
                    <div className="flex items-center gap-3 mb-4">
                         <button
                              onClick={handleBack}
                              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                              aria-label="Wróć do dashboardu"
                         >
                              <FiArrowLeft className="w-4 h-4" />
                              <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
                         </button>

                         <div className="flex-1 min-w-0">
                              <input
                                   type="text"
                                   className="w-full bg-transparent py-1 text-lg font-semibold text-slate-100 placeholder-slate-600
                                             focus:outline-none rounded transition-colors"
                                   placeholder="Tytuł tablicy..."
                                   value={boardTitle}
                                   onChange={onTitleChange}
                                   onBlur={onTitleBlur}
                                   onKeyDown={handleTitleKeyDown}
                              />
                         </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                         {/* Search - Desktop */}
                         <div className="flex-1 min-w-[180px] max-w-xs hidden sm:block">
                              <div className="relative">
                                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                   <input
                                        ref={searchInputRef}
                                        type="text"
                                        className="w-full py-2 pl-9 pr-8 bg-slate-800/50 placeholder-slate-500 text-slate-200 rounded-lg
                                                  border border-slate-700/50 hover:border-slate-600
                                                  focus:outline-none focus:border-slate-500 focus:bg-slate-800
                                                  transition-colors text-sm"
                                        placeholder="Szukaj zadań..."
                                        value={searchTerm}
                                        onChange={handleSearchInputChange}
                                   />
                                   {searchTerm && (
                                        <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                             <FiX className="w-3.5 h-3.5" />
                                        </button>
                                   )}
                              </div>
                         </div>

                         {/* Search - Mobile */}
                         <button className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors" onClick={handleSearchIconClick} aria-label="Szukaj">
                              <FiSearch className="w-5 h-5" />
                         </button>

                         {/* Filter Dropdown */}
                         <FilterDropdown
                              isOpen={filterOpen}
                              onToggle={handleFilterToggle}
                              onClose={handleFilterClose}
                              priorities={priorities}
                              filterPriority={filterPriority}
                              onFilterPriorityChange={onFilterPriorityChange}
                              assignees={assignees}
                              filterAssignee={filterAssignee}
                              onFilterAssigneeChange={onFilterAssigneeChange}
                              filterType={filterType ?? 'all'}
                              onFilterTypeChange={onFilterTypeChange}
                         />

                         {/* View Mode Toggle */}
                         <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

                         {/* Subtask Toggle */}
                         <button
                              onClick={() => onShowSubtasksChange?.(!showSubtasks)}
                              className={`
                                   flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative
                                   ${showSubtasks
                                        ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                   }
                              `}
                              title={showSubtasks ? 'Ukryj subtaski' : 'Pokaż subtaski'}
                         >
                              <FiCornerDownRight className="w-4 h-4" />
                              <span className="hidden sm:inline">Subtaski</span>
                              {showSubtasks && (
                                   <span className="w-1.5 h-1.5 rounded-full bg-orange-400 absolute top-1.5 right-1.5" />
                              )}
                         </button>

                         {/* Divider */}
                         <div className="hidden sm:block w-px h-5 bg-slate-700/50 mx-1" />

                         {/* Notes */}
                         <button
                              onClick={onOpenNotes}
                              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors"
                         >
                              <FiFileText className="w-4 h-4" />
                              <span className="hidden sm:inline">Notatki</span>
                         </button>

                         {/* API Tokens */}
                         {hasManagementAccess && onOpenApiTokens && (
                              <button
                                   onClick={onOpenApiTokens}
                                   className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors"
                              >
                                   <FiCode className="w-4 h-4" />
                                   <span className="hidden sm:inline">API</span>
                              </button>
                         )}

                         {/* Members Dropdown */}
                         {hasManagementAccess && <MembersDropdown boardId={boardId} currentUserId={currentUserId} isOpen={membersOpen} onToggle={handleMembersToggle} onClose={handleMembersClose} />}

                         {/* Add Column */}
                         <button
                              onClick={onAddColumn}
                              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-white
                                        text-slate-900 text-sm font-medium rounded-lg transition-colors"
                         >
                              <FiPlus className="w-4 h-4" />
                              <span className="hidden sm:inline">Dodaj kolumnę</span>
                         </button>
                    </div>
               </div>

               {/* Mobile Search Overlay */}
               <AnimatePresence>
                    {showMobileSearch && (
                         <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-start p-4 pt-20"
                              onClick={handleCloseMobileSearch}
                         >
                              <motion.div
                                   initial={{ opacity: 0, y: -10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -10 }}
                                   transition={{ duration: 0.15 }}
                                   className="w-full max-w-md mx-auto"
                                   onClick={(e) => e.stopPropagation()}
                              >
                                   <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                        <FiSearch className="ml-4 text-slate-500 w-5 h-5 shrink-0" />
                                        <input
                                             type="text"
                                             autoFocus
                                             className="flex-1 px-3 py-4 bg-transparent placeholder-slate-500 text-slate-100 focus:outline-none"
                                             placeholder="Szukaj zadań..."
                                             value={searchTerm}
                                             onChange={handleSearchInputChange}
                                        />
                                        <button className="p-4 text-slate-500 hover:text-slate-300 transition-colors" onClick={handleCloseMobileSearch}>
                                             <FiX className="w-5 h-5" />
                                        </button>
                                   </div>
                              </motion.div>
                         </motion.div>
                    )}
               </AnimatePresence>

               {/* Subtle active filters indicator */}
               {hasActiveFilters && <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-600" />}
          </header>
     );
};

export default BoardHeader;

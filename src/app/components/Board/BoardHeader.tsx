'use client';

import { useState, useRef, useCallback, useMemo, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiPlus, FiFileText, FiCode, FiX, FiCornerDownRight, FiMoreHorizontal, FiChevronLeft, FiBookOpen, FiUserPlus } from 'react-icons/fi';
import { Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { toast } from 'sonner';
import { BoardHeaderProps } from '@/app/types/globalTypes';
import { useHasManagementAccess } from '@/app/hooks/useHasManagementAccess';
import { useGetBoardAvatarsQuery, useGetUserRoleQuery } from '@/app/store/apiSlice';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import FilterDropdown from './FilterDropdown';
import ViewModeToggle from './ViewModeToggle';
import MembersDropdown from './MembersDropdown';
import InviteMemberModal from './InviteMemberModal';

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
     const { t } = useTranslation();
     const router = useRouter();
     const searchParams = useSearchParams();
     const { currentUser } = useCurrentUser();
     const userEmail = currentUser?.email || '';
     const { data: userRole } = useGetUserRoleQuery(userEmail, { skip: !userEmail });
     const isOwner = userRole === 'OWNER';

     useEffect(() => {
          if (searchParams.get('slack') === 'connected') {
               toast.success(t('slack.connected'));
               window.history.replaceState({}, '', window.location.pathname);
          }
     }, [searchParams, t]);

     const [showMobileSearch, setShowMobileSearch] = useState(false);
     const [filterOpen, setFilterOpen] = useState(false);
     const [membersOpen, setMembersOpen] = useState(false);
     const [inviteOpen, setInviteOpen] = useState(false);

     const searchInputRef = useRef<HTMLInputElement>(null);

     const hasManagementAccess = useHasManagementAccess();
     const avatarInputRef = useRef<HTMLInputElement>(null);
     const [avatarUploading, setAvatarUploading] = useState(false);
     const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

     const { data: boardAvatars = {} } = useGetBoardAvatarsQuery([boardId], { skip: !boardId });
     const avatarUrl = localAvatarUrl || boardAvatars[boardId] || null;

     const handleAvatarUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file || !boardId) return;
          setAvatarUploading(true);
          try {
               const previewUrl = URL.createObjectURL(file);
               setLocalAvatarUrl(previewUrl);
               const formData = new FormData();
               formData.append('file', file);
               formData.append('boardId', boardId);
               const res = await fetch('/api/upload-board-avatar', { method: 'POST', body: formData });
               if (res.ok) {
                    const data = await res.json();
                    setLocalAvatarUrl(data.url + '?t=' + Date.now());
               }
          } catch (err) {
               console.error('Avatar upload failed:', err);
               setLocalAvatarUrl(null);
          } finally {
               setAvatarUploading(false);
               if (avatarInputRef.current) avatarInputRef.current.value = '';
          }
     }, [boardId]);

     const getInitials = (title: string) => {
          const words = title.trim().split(/\s+/);
          if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
          return title.slice(0, 2).toUpperCase();
     };

     const handleSearchIconClick = useCallback(() => setShowMobileSearch((p) => !p), []);
     const handleSearchInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value), [onSearchChange]);
     const handleTitleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }, []);
     const handleFilterToggle = useCallback(() => { setFilterOpen((p) => !p); setMembersOpen(false); }, []);
     const handleFilterClose = useCallback(() => setFilterOpen(false), []);
     const handleMembersToggle = useCallback(() => { setMembersOpen((p) => !p); setFilterOpen(false); }, []);
     const handleMembersClose = useCallback(() => setMembersOpen(false), []);
     const handleCloseMobileSearch = useCallback(() => setShowMobileSearch(false), []);

     const hasActiveFilters = useMemo(() => filterPriority !== null || filterAssignee !== null || filterType !== 'all', [filterPriority, filterAssignee, filterType]);

     return (
          <header className="sticky top-11 md:top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
               {/* Breadcrumb */}
               <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-2 pb-0.5">
                    <nav className="flex items-center gap-1.5 text-[11px] text-slate-500">
                         <button onClick={() => router.push('/dashboard')} className="hover:text-slate-300 transition-colors cursor-pointer">
                              Dashboard
                         </button>
                         <span className="text-slate-700">/</span>
                         <span className="text-slate-400 truncate max-w-[200px]">{boardTitle || 'Board'}</span>
                    </nav>
               </div>

               <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
                    {/* Main row: Title + Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 min-h-[36px]">
                         <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

                         {/* Board Avatar */}
                         <button
                              onClick={() => avatarInputRef.current?.click()}
                              className="shrink-0 relative group/avatar cursor-pointer"
                              title="Zmień awatar projektu"
                         >
                              {avatarUrl ? (
                                   <img src={avatarUrl} alt="" className="w-7 h-7 rounded-md object-cover" />
                              ) : (
                                   <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center">
                                        <span className="text-[9px] font-bold text-slate-400">{getInitials(boardTitle)}</span>
                                   </div>
                              )}
                              <div className="absolute inset-0 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                   <Camera className="w-3 h-3 text-white" />
                              </div>
                              {avatarUploading && (
                                   <div className="absolute inset-0 rounded-md bg-black/60 flex items-center justify-center">
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                   </div>
                              )}
                         </button>

                         {/* Board Title */}
                         <input
                              type="text"
                              className="min-w-0 flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-100 placeholder-slate-600 focus:outline-none"
                              placeholder={t('board.boardTitle')}
                              value={boardTitle}
                              onChange={onTitleChange}
                              onBlur={onTitleBlur}
                              onKeyDown={handleTitleKeyDown}
                         />

                         {/* Right side actions */}
                         <div className="flex items-center gap-0.5 shrink-0">
                              {/* Search toggle - always visible */}
                              <button
                                   className={`p-1.5 rounded-md transition-colors ${
                                        searchTerm ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                   }`}
                                   onClick={handleSearchIconClick}
                                   title={t('common.search')}
                              >
                                   <FiSearch className="w-4 h-4" />
                              </button>

                              {/* Filter - always visible */}
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

                              {/* View Mode - always visible */}
                              <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

                              {/* Desktop-only actions */}
                              <div className="hidden md:flex items-center gap-0.5">
                                   <button
                                        onClick={() => onShowSubtasksChange?.(!showSubtasks)}
                                        className={`p-1.5 rounded-md transition-colors relative ${
                                             showSubtasks ? 'text-orange-400 bg-orange-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                        }`}
                                        title={showSubtasks ? t('board.hideSubtasks') : t('board.showSubtasks')}
                                   >
                                        <FiCornerDownRight className="w-4 h-4" />
                                   </button>

                                   <button onClick={onOpenNotes} className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" title={t('board.notes')}>
                                        <FiFileText className="w-4 h-4" />
                                   </button>

                                   <button
                                        onClick={() => router.push(`/board/${boardId}/docs`)}
                                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                                        title={t('docs.title', 'Docs')}
                                   >
                                        <FiBookOpen className="w-4 h-4" />
                                   </button>

                                   {hasManagementAccess && onOpenApiTokens && (
                                        <button onClick={onOpenApiTokens} className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" title={t('board.api')}>
                                             <FiCode className="w-4 h-4" />
                                        </button>
                                   )}

                                   {hasManagementAccess && (
                                        <button
                                             onClick={() => setInviteOpen(true)}
                                             className="p-1.5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                             title="Zaproś do tablicy"
                                        >
                                             <FiUserPlus className="w-4 h-4" />
                                        </button>
                                   )}

                                   {hasManagementAccess && <MembersDropdown boardId={boardId} currentUserId={currentUserId} isOpen={membersOpen} onToggle={handleMembersToggle} onClose={handleMembersClose} />}
                              </div>

                              {/* Mobile overflow menu */}
                              <Menu as="div" className="relative md:hidden">
                                   <Menu.Button className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                        <FiMoreHorizontal className="w-4 h-4" />
                                   </Menu.Button>
                                   <Transition
                                        enter="transition ease-out duration-100"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                   >
                                        <Menu.Items className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-30 py-1 focus:outline-none">
                                             <Menu.Item>
                                                  {({ active }) => (
                                                       <button
                                                            onClick={() => onShowSubtasksChange?.(!showSubtasks)}
                                                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                                                 active ? 'bg-slate-700/50 text-white' : showSubtasks ? 'text-orange-400' : 'text-slate-300'
                                                            }`}
                                                       >
                                                            <FiCornerDownRight className="w-4 h-4" />
                                                            {showSubtasks ? t('board.hideSubtasks') : t('board.showSubtasks')}
                                                       </button>
                                                  )}
                                             </Menu.Item>
                                             <Menu.Item>
                                                  {({ active }) => (
                                                       <button
                                                            onClick={onOpenNotes}
                                                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${active ? 'bg-slate-700/50 text-white' : 'text-slate-300'}`}
                                                       >
                                                            <FiFileText className="w-4 h-4" />
                                                            {t('board.notes')}
                                                       </button>
                                                  )}
                                             </Menu.Item>
                                             <Menu.Item>
                                                  {({ active }) => (
                                                       <button
                                                            onClick={() => router.push(`/board/${boardId}/docs`)}
                                                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${active ? 'bg-slate-700/50 text-white' : 'text-slate-300'}`}
                                                       >
                                                            <FiBookOpen className="w-4 h-4" />
                                                            {t('docs.title', 'Docs')}
                                                       </button>
                                                  )}
                                             </Menu.Item>
                                             {hasManagementAccess && onOpenApiTokens && (
                                                  <Menu.Item>
                                                       {({ active }) => (
                                                            <button
                                                                 onClick={onOpenApiTokens}
                                                                 className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${active ? 'bg-slate-700/50 text-white' : 'text-slate-300'}`}
                                                            >
                                                                 <FiCode className="w-4 h-4" />
                                                                 {t('board.api')}
                                                            </button>
                                                       )}
                                                  </Menu.Item>
                                             )}
                                        </Menu.Items>
                                   </Transition>
                              </Menu>

                              {/* Divider + Add Column */}
                              <div className="w-px h-4 bg-slate-800 mx-1" />
                              <button
                                   onClick={onAddColumn}
                                   className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                              >
                                   <FiPlus className="w-3.5 h-3.5" />
                                   <span className="hidden sm:inline">{t('board.addColumn')}</span>
                              </button>
                         </div>
                    </div>
               </div>

               {/* Search overlay */}
               <AnimatePresence>
                    {showMobileSearch && (
                         <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden border-t border-slate-800"
                         >
                              <div className="px-4 sm:px-6 lg:px-8 py-2.5">
                                   <div className="relative">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                        <input
                                             type="text"
                                             autoFocus
                                             className="w-full py-2 pl-10 pr-8 bg-slate-800/60 placeholder-slate-500 text-slate-200 rounded-lg border border-slate-700/50 focus:outline-none focus:border-slate-600 text-sm"
                                             placeholder={t('board.searchTasks')}
                                             value={searchTerm}
                                             onChange={handleSearchInputChange}
                                        />
                                        <button
                                             onClick={() => { onSearchChange(''); handleCloseMobileSearch(); }}
                                             className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                             <FiX className="w-3.5 h-3.5" />
                                        </button>
                                   </div>
                              </div>
                         </motion.div>
                    )}
               </AnimatePresence>

               {hasActiveFilters && <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-500/50" />}

               <InviteMemberModal boardId={boardId} isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
          </header>
     );
};

export default BoardHeader;

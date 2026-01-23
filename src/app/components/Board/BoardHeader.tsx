'use client';

import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

import { FiArrowLeft, FiSearch, FiFilter, FiGrid, FiList, FiPlus, FiUserPlus, FiX, FiFileText, FiCode, FiFlag, FiUsers, FiTag } from 'react-icons/fi';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import { BoardHeaderProps } from '@/app/types/globalTypes';
import UserSelector from '@/app/components/SingleTaskView/UserSelector';
import Avatar from '../Avatar/Avatar';
import { useGetAllUsersQuery, useGetBoardMembersQuery, useAddMemberToBoardMutation, useRemoveMemberFromBoardMutation } from '@/app/store/apiSlice';
import { useHasManagementAccess } from '@/app/hooks/useHasManagementAccess';
import { toast } from 'sonner';
import type { TaskTypeFilter } from '@/app/types/globalTypes';

interface ExtendedBoardHeaderProps extends BoardHeaderProps {
     boardId: string;
     currentUserId?: string;
     onOpenNotes: () => void;
     onOpenApiTokens?: () => void;
}

// Helper function to get display values
const getDisplayData = (user: { name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string }) => ({
     name: user.custom_name || user.name || user.email || 'User',
     image: user.custom_image || user.image,
});

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
}: ExtendedBoardHeaderProps) => {
     const router = useRouter();

     const [showMobileSearch, setShowMobileSearch] = useState(false);
     const [filterOpen, setFilterOpen] = useState(false);
     const [membersOpen, setMembersOpen] = useState(false);

     const filterRef = useRef<HTMLDivElement>(null);
     const membersRef = useRef<HTMLDivElement>(null);

     const { data: allUsers = [] } = useGetAllUsersQuery();
     const { data: boardMembers = [], refetch: refetchMembers } = useGetBoardMembersQuery(boardId);
     const [addMember] = useAddMemberToBoardMutation();
     const [removeMember] = useRemoveMemberFromBoardMutation();

     const hasManagementAccess = useHasManagementAccess();

     useOutsideClick([filterRef], () => setFilterOpen(false));
     useOutsideClick([membersRef], () => setMembersOpen(false));

     const handleBack = () => router.push('/dashboard');
     const handleSearchIconClick = () => setShowMobileSearch((p) => !p);
     const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value);
     const handleFilterToggle = () => setFilterOpen((p) => !p);
     const handleClearFilters = () => {
          onFilterPriorityChange(null);
          onFilterAssigneeChange(null);
          onFilterTypeChange?.('all');
     };
     const handleViewToggle = (mode: 'columns' | 'list') => onViewModeChange(mode);
     const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
     };

     const handleAddUsers = async (userIds: string[]) => {
          let added = 0;
          for (const userId of userIds) {
               if (userId === currentUserId) continue;
               try {
                    await addMember({ boardId, userId }).unwrap();
                    added++;
               } catch {}
          }
          if (added > 0) {
               toast.success(`Dodano ${added} użytkownika do boarda`);
               refetchMembers();
          }
     };

     const handleRemoveUser = async (userId: string) => {
          if (userId === currentUserId) return;
          try {
               await removeMember({ boardId, userId }).unwrap();
               toast.success('Usunięto użytkownika z boarda');
               refetchMembers();
          } catch {
               toast.error('Nie udało się usunąć użytkownika');
          }
     };

     const availableToAdd = allUsers.filter((u) => u.id !== currentUserId && !boardMembers.some((m) => m.id === u.id));

     const hasActiveFilters = filterPriority !== null || filterAssignee !== null || filterType !== 'all';

     return (
          <header className="sticky top-0 z-20 bg-slate-800 border-b border-slate-700/50 shadow-md">
               <div className="w-full px-3 sm:px-6 lg:px-8 pt-4 pb-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                         <button
                              onClick={handleBack}
                              className="flex items-center px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
                              aria-label="Back to dashboard"
                         >
                              <FiArrowLeft className="w-5 h-5 mr-1" />
                              <span className="hidden sm:inline">Dashboard</span>
                         </button>
                         <input
                              type="text"
                              className="bg-transparent py-2 text-xl font-semibold text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-lg flex-1 min-w-0"
                              style={{ minWidth: 0 }}
                              placeholder="Board title…"
                              value={boardTitle}
                              onChange={onTitleChange}
                              onBlur={onTitleBlur}
                              onKeyDown={handleTitleKeyDown}
                         />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full">
                         <div className="flex-1 min-w-30 max-w-xs">
                              <div className="relative hidden sm:block">
                                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                   <input
                                        type="text"
                                        className="w-full py-2 pl-10 pr-4 bg-slate-700/50 placeholder-slate-400 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={handleSearchInputChange}
                                   />
                              </div>
                              <button className="sm:hidden p-2 rounded hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-500" onClick={handleSearchIconClick}>
                                   <FiSearch className="w-5 h-5 text-slate-300" />
                              </button>
                         </div>
                         <div className="relative" ref={filterRef}>
                              <button
                                   onClick={handleFilterToggle}
                                   className={`
                                        flex items-center px-4 py-2 text-slate-200 text-sm rounded-lg 
                                        focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all
                                        w-full sm:w-auto
                                        ${hasActiveFilters ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40' : 'bg-slate-700/50 hover:bg-slate-600/50'}
                                   `}
                                   aria-haspopup="true"
                                   aria-expanded={filterOpen}
                              >
                                   <FiFilter className={`w-5 h-5 mr-1 ${hasActiveFilters ? 'text-blue-400' : ''}`} />
                                   <span className="hidden sm:inline">Filters</span>
                                   {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>}
                              </button>
                              {filterOpen && (
                                   <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 z-40 overflow-hidden">
                                        <div className="p-4 space-y-4">
                                             <div>
                                                  <div className="flex items-center gap-2 mb-3">
                                                       <FiFlag className="w-4 h-4 text-orange-400" />
                                                       <div className="text-sm font-semibold text-slate-200">Priorytet</div>
                                                  </div>
                                                  <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                       <li>
                                                            <label
                                                                 className={`
                                                                 flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                                                                 transition-all duration-200
                                                                 ${filterPriority === null ? 'bg-blue-500/20 border border-blue-500/40' : 'hover:bg-slate-700/50 border border-transparent'}
                                                            `}
                                                            >
                                                                 <div
                                                                      className={`
                                                                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                                      ${filterPriority === null ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}
                                                                 `}
                                                                 >
                                                                      {filterPriority === null && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                 </div>
                                                                 <input
                                                                      type="radio"
                                                                      name="filter-priority"
                                                                      className="hidden"
                                                                      checked={filterPriority === null}
                                                                      onChange={() => onFilterPriorityChange(null)}
                                                                 />
                                                                 <span className="text-sm font-medium">Wszystkie</span>
                                                            </label>
                                                       </li>
                                                       {priorities.map((p) => (
                                                            <li key={p.id}>
                                                                 <label
                                                                      className={`
                                                                      flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                                                                      transition-all duration-200
                                                                      ${filterPriority === p.id ? 'bg-blue-500/20 border border-blue-500/40' : 'hover:bg-slate-700/50 border border-transparent'}
                                                                 `}
                                                                 >
                                                                      <div
                                                                           className={`
                                                                           w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                                           ${filterPriority === p.id ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}
                                                                      `}
                                                                      >
                                                                           {filterPriority === p.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                      </div>
                                                                      <input
                                                                           type="radio"
                                                                           name="filter-priority"
                                                                           className="hidden"
                                                                           checked={filterPriority === p.id}
                                                                           onChange={() => onFilterPriorityChange(p.id)}
                                                                      />
                                                                      <span
                                                                           className="text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2"
                                                                           style={{ backgroundColor: p.color + '30', color: p.color }}
                                                                      >
                                                                           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                                                                           {p.label}
                                                                      </span>
                                                                 </label>
                                                            </li>
                                                       ))}
                                                  </ul>
                                             </div>
                                             <div className="border-t border-slate-700/50 my-3"></div>
                                             <div>
                                                  <div className="flex items-center gap-2 mb-3">
                                                       <FiUsers className="w-4 h-4 text-purple-400" />
                                                       <div className="text-sm font-semibold text-slate-200">Przypisani</div>
                                                  </div>
                                                  <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                       <li>
                                                            <label
                                                                 className={`
                                                                 flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                                                                 transition-all duration-200
                                                                 ${filterAssignee === null ? 'bg-blue-500/20 border border-blue-500/40' : 'hover:bg-slate-700/50 border border-transparent'}
                                                            `}
                                                            >
                                                                 <div
                                                                      className={`
                                                                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                                      ${filterAssignee === null ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}
                                                                 `}
                                                                 >
                                                                      {filterAssignee === null && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                 </div>
                                                                 <input
                                                                      type="radio"
                                                                      name="filter-assignee"
                                                                      className="hidden"
                                                                      checked={filterAssignee === null}
                                                                      onChange={() => onFilterAssigneeChange(null)}
                                                                 />
                                                                 <span className="text-sm font-medium">Wszyscy</span>
                                                            </label>
                                                       </li>
                                                       {assignees.map((u) => (
                                                            <li key={u.id}>
                                                                 <label
                                                                      className={`
                                                                      flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                                                                      transition-all duration-200
                                                                      ${filterAssignee === u.id ? 'bg-blue-500/20 border border-blue-500/40' : 'hover:bg-slate-700/50 border border-transparent'}
                                                                 `}
                                                                 >
                                                                      <div
                                                                           className={`
                                                                           w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                                           ${filterAssignee === u.id ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}
                                                                      `}
                                                                      >
                                                                           {filterAssignee === u.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                      </div>
                                                                      <input
                                                                           type="radio"
                                                                           name="filter-assignee"
                                                                           className="hidden"
                                                                           checked={filterAssignee === u.id}
                                                                           onChange={() => onFilterAssigneeChange(u.id)}
                                                                      />
                                                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                           <Avatar src={u.image || ''} alt={u.name} size={24} className="shrink-0" />
                                                                           <span className="text-sm font-medium truncate">{u.name}</span>
                                                                      </div>
                                                                 </label>
                                                            </li>
                                                       ))}
                                                  </ul>
                                             </div>
                                             <div className="border-t border-slate-700/50 my-3"></div>
                                             <div>
                                                  <div className="flex items-center gap-2 mb-3">
                                                       <FiTag className="w-4 h-4 text-emerald-400" />
                                                       <div className="text-sm font-semibold text-slate-200">Typ zadania</div>
                                                  </div>
                                                  <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
                                                       {(['all', 'task', 'story'] as TaskTypeFilter[]).map((t) => (
                                                            <button
                                                                 key={t}
                                                                 onClick={() => onFilterTypeChange?.(t)}
                                                                 className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                                                                      filterType === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                                                 }`}
                                                            >
                                                                 {t === 'all' ? 'Wszystkie' : t.charAt(0).toUpperCase() + t.slice(1)}
                                                            </button>
                                                       ))}
                                                  </div>
                                             </div>
                                             {hasActiveFilters && (
                                                  <div className="pt-3 border-t border-slate-700/50">
                                                       <button
                                                            onClick={handleClearFilters}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 font-medium text-sm border border-red-500/30"
                                                       >
                                                            <FiX className="w-4 h-4" />
                                                            Wyczyść filtry
                                                       </button>
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              )}
                         </div>
                         <div className="flex bg-slate-700/50 rounded-lg overflow-hidden">
                              <button
                                   onClick={() => handleViewToggle('columns')}
                                   className={`flex items-center justify-center px-4 py-2 text-sm ${
                                        viewMode === 'columns' ? 'bg-slate-600 text-slate-100' : 'text-slate-300 hover:bg-slate-600/50'
                                   } transition`}
                              >
                                   <FiGrid className="w-5 h-5 mr-1" />
                                   <span className="hidden sm:inline">Board</span>
                              </button>
                              <button
                                   onClick={() => handleViewToggle('list')}
                                   className={`flex items-center justify-center px-4 py-2 text-sm ${
                                        viewMode === 'list' ? 'bg-slate-600 text-slate-100' : 'text-slate-300 hover:bg-slate-600/50'
                                   } transition`}
                              >
                                   <FiList className="w-5 h-5 mr-1" />
                                   <span className="hidden sm:inline">List</span>
                              </button>
                         </div>
                         <button onClick={onOpenNotes} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-lg transition">
                              <FiFileText className="w-5 h-5 mr-1" />
                              <span className="hidden sm:inline">Notes</span>
                         </button>
                         {hasManagementAccess && onOpenApiTokens && (
                              <button onClick={onOpenApiTokens} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-lg transition">
                                   <FiCode className="w-5 h-5 mr-1" />
                                   <span className="hidden sm:inline">API</span>
                              </button>
                         )}
                         {hasManagementAccess && (
                              <div className="relative" ref={membersRef}>
                                   <button
                                        onClick={() => setMembersOpen((p) => !p)}
                                        className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-lg transition"
                                   >
                                        <FiUserPlus className="w-5 h-5 mr-1" />
                                        <span className="hidden sm:inline">Członkowie ({boardMembers.length})</span>
                                   </button>
                                   {membersOpen && (
                                        <div
                                             className="absolute right-0 mt-2 w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 flex flex-col"
                                             style={{ maxHeight: 'calc(100vh - 160px)' }}
                                        >
                                             <div className="p-4 flex-1 overflow-y-auto">
                                                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Aktualni członkowie</h3>
                                                  {boardMembers.length === 0 ? (
                                                       <p className="text-slate-500 text-sm mb-6">Brak członków</p>
                                                  ) : (
                                                       <ul className="space-y-2 mb-6">
                                                            {boardMembers.map((user) => {
                                                                 const userDisplay = getDisplayData(user);
                                                                 return (
                                                                      <li key={user.id} className="flex items-center justify-between bg-slate-700/50 px-3 py-2 rounded-lg">
                                                                           <div className="flex items-center gap-3">
                                                                                <Avatar src={userDisplay.image || ''} alt={userDisplay.name} size={28} />
                                                                                <div>
                                                                                     <div className="text-white text-sm font-medium">{userDisplay.name}</div>
                                                                                     <div className="text-slate-400 text-xs">{user.email}</div>
                                                                                </div>
                                                                           </div>
                                                                           {user.id !== currentUserId && (
                                                                                <button onClick={() => handleRemoveUser(user.id)} className="text-red-400 hover:text-red-300 transition">
                                                                                     <FiX className="w-5 h-5" />
                                                                                </button>
                                                                           )}
                                                                      </li>
                                                                 );
                                                            })}
                                                       </ul>
                                                  )}
                                                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Dodaj nowych</h3>
                                                  <div className="min-h-48">
                                                       <UserSelector selectedUsers={[]} availableUsers={availableToAdd} onUsersChange={handleAddUsers} label="Wybierz użytkowników" />
                                                  </div>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         )}
                         <button onClick={onAddColumn} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-medium rounded-lg transition">
                              <FiPlus className="w-5 h-5 mr-1" />
                              <span className="hidden sm:inline">Add Column</span>
                         </button>
                    </div>
               </div>
               {showMobileSearch && (
                    <div className="fixed inset-0 z-30 bg-black/50 flex items-start p-4 pt-20">
                         <div className="relative w-full max-w-md mx-auto">
                              <div className="flex items-center bg-slate-800 rounded-md border border-slate-700">
                                   <FiSearch className="ml-2 text-slate-400 w-5 h-5" />
                                   <input
                                        type="text"
                                        autoFocus
                                        className="flex-1 px-2 py-1 bg-transparent placeholder-slate-400 text-slate-100 focus:outline-none"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={handleSearchInputChange}
                                   />
                                   <button className="p-2" onClick={() => setShowMobileSearch(false)}>
                                        <span className="text-slate-300 text-lg">×</span>
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </header>
     );
};

export default BoardHeader;

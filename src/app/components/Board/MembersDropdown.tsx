'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUserPlus, FiX, FiUsers, FiSearch, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import Avatar from '@/app/components/Avatar/Avatar';
import { toast } from 'sonner';
import { useGetAllUsersQuery, useGetBoardMembersQuery, useAddMemberToBoardMutation, useRemoveMemberFromBoardMutation } from '@/app/store/apiSlice';

interface MembersDropdownProps {
     boardId: string;
     currentUserId?: string;
     isOpen: boolean;
     onToggle: () => void;
     onClose: () => void;
}

const getDisplayData = (user: { name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string }) => ({
     name: user.custom_name || user.name || user.email || 'Użytkownik',
     image: user.custom_image || user.image,
});

const MembersDropdown = ({ boardId, currentUserId, isOpen, onToggle, onClose }: MembersDropdownProps) => {
     const { t } = useTranslation();
     const containerRef = useRef<HTMLDivElement>(null);
     const [searchQuery, setSearchQuery] = useState('');

     const { data: allUsers = [] } = useGetAllUsersQuery();
     const { data: boardMembers = [], refetch: refetchMembers } = useGetBoardMembersQuery(boardId);
     const [addMember] = useAddMemberToBoardMutation();
     const [removeMember] = useRemoveMemberFromBoardMutation();

     useOutsideClick([containerRef], onClose, isOpen);

     const availableToAdd = useMemo(
          () => allUsers.filter((u) => u.id !== currentUserId && !boardMembers.some((m) => m.id === u.id)),
          [allUsers, currentUserId, boardMembers],
     );

     const filteredUsers = useMemo(() => {
          if (!searchQuery.trim()) return availableToAdd;
          const q = searchQuery.toLowerCase();
          return availableToAdd.filter((u) => {
               const name = (u.custom_name || u.name || '').toLowerCase();
               const email = (u.email || '').toLowerCase();
               return name.includes(q) || email.includes(q);
          });
     }, [availableToAdd, searchQuery]);

     const handleAddUser = useCallback(
          async (userId: string) => {
               try {
                    await addMember({ boardId, userId }).unwrap();
                    toast.success(t('membersDropdown.userAdded'));
                    refetchMembers();
               } catch {
                    toast.error(t('membersDropdown.addFailed'));
               }
          },
          [addMember, boardId, refetchMembers],
     );

     const handleRemoveUser = useCallback(
          async (userId: string) => {
               if (userId === currentUserId) return;
               try {
                    await removeMember({ boardId, userId }).unwrap();
                    toast.success(t('membersDropdown.userRemoved'));
                    refetchMembers();
               } catch {
                    toast.error(t('membersDropdown.removeFailed'));
               }
          },
          [removeMember, boardId, currentUserId, refetchMembers],
     );

     const isMember = useCallback((userId: string) => boardMembers.some((m) => m.id === userId), [boardMembers]);

     return (
          <div className="relative" ref={containerRef}>
               <button
                    onClick={onToggle}
                    className={`
                         flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                         ${isOpen ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
                    `}
               >
                    <FiUserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{t('membersDropdown.boardMembers')}</span>
                    <span className="bg-slate-600 text-slate-300 text-xs px-1.5 py-0.5 rounded min-w-[18px] text-center">{boardMembers.length}</span>
               </button>

               <AnimatePresence>
                    {isOpen && (
                         <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50"
                         >
                              {/* Header */}
                              <div className="px-4 py-3 border-b border-slate-700">
                                   <span className="text-sm font-medium text-slate-200">{t('membersDropdown.boardMembers')}</span>
                              </div>

                              {/* Current Members */}
                              <div className="p-3 border-b border-slate-700">
                                   <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">
                                        {t('membersDropdown.current', { count: boardMembers.length })}
                                   </div>

                                   {boardMembers.length === 0 ? (
                                        <div className="text-center py-3 text-slate-500 text-sm">
                                             <FiUsers className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                             {t('membersDropdown.noMembers')}
                                        </div>
                                   ) : (
                                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                                             {boardMembers.map((user) => {
                                                  const userDisplay = getDisplayData(user);
                                                  const isCurrentUser = user.id === currentUserId;

                                                  return (
                                                       <li
                                                            key={user.id}
                                                            className={`
                                                                 flex items-center justify-between p-2 rounded-lg
                                                                 ${isCurrentUser ? 'bg-slate-700/30' : 'hover:bg-slate-700/30'}
                                                            `}
                                                       >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                 <Avatar src={userDisplay.image || ''} alt={userDisplay.name} size={28} />
                                                                 <div className="min-w-0">
                                                                      <div className="text-sm text-slate-200 truncate flex items-center gap-1.5">
                                                                           {userDisplay.name}
                                                                           {isCurrentUser && <span className="text-[10px] text-slate-500">{t('common.you')}</span>}
                                                                      </div>
                                                                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                                                 </div>
                                                            </div>

                                                            {!isCurrentUser && (
                                                                 <button
                                                                      onClick={() => handleRemoveUser(user.id)}
                                                                      className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors"
                                                                      title={t('membersDropdown.remove')}
                                                                 >
                                                                      <FiX className="w-4 h-4" />
                                                                 </button>
                                                            )}
                                                       </li>
                                                  );
                                             })}
                                        </ul>
                                   )}
                              </div>

                              {/* Add New Members - inline list instead of nested dropdown */}
                              {availableToAdd.length > 0 && (
                                   <div className="p-3">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">{t('membersDropdown.addNew')}</div>

                                        {/* Search input */}
                                        <div className="relative mb-2">
                                             <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                             <input
                                                  type="text"
                                                  placeholder={t('membersDropdown.search')}
                                                  value={searchQuery}
                                                  onChange={(e) => setSearchQuery(e.target.value)}
                                                  className="w-full pl-8 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                                             />
                                        </div>

                                        {/* User list */}
                                        <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                                             {filteredUsers.length === 0 ? (
                                                  <li className="text-center py-3 text-slate-500 text-sm">{t('membersDropdown.noResults')}</li>
                                             ) : (
                                                  filteredUsers.map((user) => {
                                                       const userDisplay = getDisplayData(user);
                                                       const member = isMember(user.id);

                                                       return (
                                                            <li
                                                                 key={user.id}
                                                                 onClick={() => !member && handleAddUser(user.id)}
                                                                 className={`
                                                                      flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors
                                                                      ${member ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50'}
                                                                 `}
                                                            >
                                                                 <Avatar src={userDisplay.image || ''} alt={userDisplay.name} size={28} />
                                                                 <div className="min-w-0 flex-1">
                                                                      <div className="text-sm text-slate-200 truncate">{userDisplay.name}</div>
                                                                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                                                 </div>
                                                                 {member && <FiCheck className="w-4 h-4 text-green-500" />}
                                                            </li>
                                                       );
                                                  })
                                             )}
                                        </ul>
                                   </div>
                              )}
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default MembersDropdown;

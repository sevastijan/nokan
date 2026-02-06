'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import Avatar from '../Avatar/Avatar';
import { UserSelectorProps } from '@/app/types/globalTypes';

const UserSelector = ({ selectedUsers, availableUsers, onUsersChange, label = 'Przypisani' }: UserSelectorProps) => {
     const [isOpen, setIsOpen] = useState(false);
     const selectRef = useRef<HTMLDivElement>(null);

     const toggleOpen = () => setIsOpen((prev) => !prev);

     useEffect(() => {
          if (!isOpen) return;
          const handleClickOutside = (e: MouseEvent) => {
               if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
                    setIsOpen(false);
               }
          };
          const handleEsc = (e: KeyboardEvent) => {
               if (e.key === 'Escape') setIsOpen(false);
          };
          document.addEventListener('mousedown', handleClickOutside);
          document.addEventListener('keydown', handleEsc);
          return () => {
               document.removeEventListener('mousedown', handleClickOutside);
               document.removeEventListener('keydown', handleEsc);
          };
     }, [isOpen]);

     const handleToggleUser = useCallback(
          (userId: string) => {
               const currentIds = selectedUsers.map((u) => u.id);
               const newIds = currentIds.includes(userId) ? currentIds.filter((id) => id !== userId) : [...currentIds, userId];
               onUsersChange(newIds);
          },
          [selectedUsers, onUsersChange],
     );

     const handleRemoveUser = useCallback(
          (userId: string, e: React.MouseEvent) => {
               e.stopPropagation();
               const newIds = selectedUsers.filter((u) => u.id !== userId).map((u) => u.id);
               onUsersChange(newIds);
          },
          [selectedUsers, onUsersChange],
     );

     const isSelected = (userId: string) => selectedUsers.some((u) => u.id === userId);
     const getDisplayName = (user: { name?: string | null; custom_name?: string | null }) => user.custom_name || user.name || 'Unknown User';
     const getDisplayAvatar = (user: { image?: string | null; custom_image?: string | null }) => user.custom_image || user.image || '';

     return (
          <div className="relative w-full" ref={selectRef}>
               {label && <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>}

               <div
                    role="button"
                    tabIndex={0}
                    className={`
                         relative w-full min-h-[42px] bg-slate-700/50 border rounded-lg px-3 py-2
                         text-left cursor-pointer transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-slate-500/50
                         ${isOpen ? 'ring-2 ring-slate-500/50 border-slate-500/50 bg-slate-700/70' : 'border-slate-600/50 hover:border-slate-500'}
                    `}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={toggleOpen}
                    onKeyDown={(e) => {
                         if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleOpen();
                         }
                    }}
               >
                    <div className="flex items-center justify-between gap-2">
                         {selectedUsers.length === 0 ? (
                              <span className="text-slate-500 text-sm flex items-center gap-2">
                                   <FiPlus className="w-4 h-4" />
                                   Wybierz osoby...
                              </span>
                         ) : (
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                   <div className="flex items-center -space-x-2">
                                        {selectedUsers.slice(0, 4).map((user, idx) => (
                                             <div key={user.id} style={{ zIndex: 4 - idx }}>
                                                  <Avatar
                                                       src={getDisplayAvatar(user)}
                                                       alt={getDisplayName(user)}
                                                       size={26}
                                                       className="border-2 border-slate-700"
                                                  />
                                             </div>
                                        ))}
                                        {selectedUsers.length > 4 && (
                                             <div className="w-[26px] h-[26px] rounded-full bg-slate-600 border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-medium">
                                                  +{selectedUsers.length - 4}
                                             </div>
                                        )}
                                   </div>
                                   <div className="flex flex-col min-w-0">
                                        {selectedUsers.length === 1 ? (
                                             <span className="text-sm text-slate-200 truncate">{getDisplayName(selectedUsers[0])}</span>
                                        ) : (
                                             <span className="text-sm text-slate-300">{selectedUsers.length} osoby</span>
                                        )}
                                   </div>
                              </div>
                         )}
                         <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                              <FiChevronDown className="w-4 h-4 text-slate-400" />
                         </motion.div>
                    </div>
               </div>

               <AnimatePresence>
                    {isOpen && (
                         <motion.div
                              className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 overflow-hidden"
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.15 }}
                         >
                              {/* Selected users section */}
                              {selectedUsers.length > 0 && (
                                   <div className="p-2 border-b border-slate-700/50">
                                        <div className="text-xs text-slate-500 mb-2 px-1">Przypisani ({selectedUsers.length})</div>
                                        <div className="flex flex-wrap gap-1">
                                             {selectedUsers.map((user) => (
                                                  <span
                                                       key={user.id}
                                                       className="inline-flex items-center gap-1 bg-slate-700 px-2 py-1 rounded text-xs text-slate-300"
                                                  >
                                                       <Avatar src={getDisplayAvatar(user)} alt={getDisplayName(user)} size={16} />
                                                       <span className="truncate max-w-[100px]">{getDisplayName(user)}</span>
                                                       <button
                                                            type="button"
                                                            onClick={(e) => handleRemoveUser(user.id, e)}
                                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                                       >
                                                            <FiX className="w-3 h-3" />
                                                       </button>
                                                  </span>
                                             ))}
                                        </div>
                                   </div>
                              )}

                              {/* Available users list */}
                              <ul className="max-h-48 overflow-auto" role="listbox">
                                   {availableUsers.length === 0 ? (
                                        <li className="px-4 py-3 text-slate-500 text-sm text-center">Brak użytkowników</li>
                                   ) : (
                                        availableUsers.map((user) => {
                                             const selected = isSelected(user.id);
                                             return (
                                                  <li
                                                       key={user.id}
                                                       className={`
                                                            px-3 py-2 cursor-pointer flex items-center gap-2.5 transition-colors
                                                            ${selected ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}
                                                       `}
                                                       onClick={() => handleToggleUser(user.id)}
                                                       role="option"
                                                       aria-selected={selected}
                                                  >
                                                       <div
                                                            className={`
                                                                 w-4 h-4 rounded flex items-center justify-center shrink-0
                                                                 ${selected ? 'bg-blue-500' : 'border border-slate-500'}
                                                            `}
                                                       >
                                                            {selected && <FiCheck className="w-3 h-3 text-white" />}
                                                       </div>
                                                       <Avatar src={getDisplayAvatar(user)} alt={getDisplayName(user)} size={24} />
                                                       <div className="flex flex-col min-w-0 flex-1">
                                                            <span className={`text-sm truncate ${selected ? 'text-slate-200' : 'text-slate-300'}`}>
                                                                 {getDisplayName(user)}
                                                            </span>
                                                            <span className="text-slate-500 text-xs truncate">{user.email}</span>
                                                       </div>
                                                  </li>
                                             );
                                        })
                                   )}
                              </ul>
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default UserSelector;

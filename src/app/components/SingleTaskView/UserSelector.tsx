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
                         relative w-full min-h-[46px] bg-slate-700/50 border rounded-lg px-3 py-2
                         text-left cursor-pointer transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50
                         ${isOpen ? 'ring-2 ring-purple-500/50 border-purple-500/50 bg-slate-700/70' : 'border-slate-600/50 hover:border-slate-500'}
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
                         <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                              {selectedUsers.length === 0 ? (
                                   <span className="text-slate-500 text-sm flex items-center gap-2">
                                        <FiPlus className="w-4 h-4" />
                                        Wybierz osoby...
                                   </span>
                              ) : (
                                   selectedUsers.map((user) => (
                                        <motion.span
                                             key={user.id}
                                             initial={{ scale: 0.9, opacity: 0 }}
                                             animate={{ scale: 1, opacity: 1 }}
                                             className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 px-2 py-1 rounded-md text-sm"
                                        >
                                             <Avatar src={getDisplayAvatar(user)} alt={getDisplayName(user)} size={18} className="ring-1 ring-purple-400/30" />
                                             <span className="text-white truncate max-w-[80px] text-xs font-medium">{getDisplayName(user)}</span>
                                             <button
                                                  type="button"
                                                  onClick={(e) => handleRemoveUser(user.id, e)}
                                                  className="text-slate-400 hover:text-red-400 transition-colors ml-0.5"
                                             >
                                                  <FiX className="w-3 h-3" />
                                             </button>
                                        </motion.span>
                                   ))
                              )}
                         </div>
                         <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                              <FiChevronDown className="w-4 h-4 text-slate-400" />
                         </motion.div>
                    </div>
               </div>

               <AnimatePresence>
                    {isOpen && (
                         <motion.ul
                              className="absolute z-50 mt-2 w-full bg-slate-800 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 max-h-60 overflow-auto thin-scrollbar"
                              initial={{ opacity: 0, y: -5, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              role="listbox"
                         >
                              {availableUsers.length === 0 ? (
                                   <li className="px-4 py-4 text-slate-500 text-sm text-center">Brak dostępnych użytkowników</li>
                              ) : (
                                   availableUsers.map((user) => {
                                        const selected = isSelected(user.id);
                                        return (
                                             <li
                                                  key={user.id}
                                                  className={`
                                                       px-3 py-2.5 cursor-pointer flex items-center gap-3 transition-all duration-150
                                                       ${selected ? 'bg-purple-500/15' : 'hover:bg-slate-700/50'}
                                                  `}
                                                  onClick={() => handleToggleUser(user.id)}
                                                  role="option"
                                                  aria-selected={selected}
                                             >
                                                  <div
                                                       className={`
                                                            w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200
                                                            ${selected ? 'bg-purple-500 shadow-md shadow-purple-500/30' : 'border-2 border-slate-500'}
                                                       `}
                                                  >
                                                       {selected && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                                  </div>
                                                  <Avatar
                                                       src={getDisplayAvatar(user)}
                                                       alt={getDisplayName(user)}
                                                       size={28}
                                                       className={`ring-2 ${selected ? 'ring-purple-400/40' : 'ring-slate-600/50'}`}
                                                  />
                                                  <div className="flex flex-col truncate min-w-0 flex-1">
                                                       <span className={`truncate text-sm font-medium ${selected ? 'text-white' : 'text-slate-300'}`}>
                                                            {getDisplayName(user)}
                                                       </span>
                                                       <span className="text-slate-500 text-xs truncate">{user.email}</span>
                                                  </div>
                                             </li>
                                        );
                                   })
                              )}
                         </motion.ul>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default UserSelector;

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import Avatar from '../Avatar/Avatar';
import { User } from '@/app/types/globalTypes';

interface CollaboratorsSelectorProps {
     selectedCollaborators: User[];
     availableUsers: User[];
     onCollaboratorsChange: (collaboratorIds: string[]) => void;
     assigneeId?: string | null;
     label?: string;
}

const CollaboratorsSelector = ({
     selectedCollaborators,
     availableUsers,
     onCollaboratorsChange,
     assigneeId,
     label = 'Współpracownicy',
}: CollaboratorsSelectorProps) => {
     const [isOpen, setIsOpen] = useState(false);
     const selectRef = useRef<HTMLDivElement>(null);

     // Filter out assignee from available collaborators
     const filteredUsers = availableUsers.filter((u) => u.id !== assigneeId);

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

     const handleToggleCollaborator = useCallback(
          (userId: string) => {
               const currentIds = selectedCollaborators.map((c) => c.id);
               let newIds: string[];

               if (currentIds.includes(userId)) {
                    newIds = currentIds.filter((id) => id !== userId);
               } else {
                    newIds = [...currentIds, userId];
               }

               onCollaboratorsChange(newIds);
          },
          [selectedCollaborators, onCollaboratorsChange]
     );

     const handleRemoveCollaborator = useCallback(
          (userId: string, e: React.MouseEvent) => {
               e.stopPropagation();
               const newIds = selectedCollaborators.filter((c) => c.id !== userId).map((c) => c.id);
               onCollaboratorsChange(newIds);
          },
          [selectedCollaborators, onCollaboratorsChange]
     );

     const isSelected = (userId: string) => selectedCollaborators.some((c) => c.id === userId);

     return (
          <div className="relative w-full" ref={selectRef}>
               <label className="block text-sm text-slate-300 mb-1">{label}</label>

               <button
                    type="button"
                    className={`relative w-full bg-slate-700/50 border border-slate-600 rounded-xl shadow-sm px-4 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 min-h-[42px] ${
                         isOpen ? 'ring-2 ring-purple-500 border-transparent' : 'hover:border-slate-500'
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={toggleOpen}
               >
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                              {selectedCollaborators.length === 0 ? (
                                   <span className="text-slate-400 italic truncate flex items-center gap-2">
                                        <FiPlus className="w-4 h-4" />
                                        Dodaj współpracowników...
                                   </span>
                              ) : (
                                   selectedCollaborators.map((collaborator) => (
                                        <span
                                             key={collaborator.id}
                                             className="inline-flex items-center gap-1.5 bg-slate-600/50 px-2 py-1 rounded-lg text-sm"
                                        >
                                             <Avatar src={collaborator.image || ''} alt={collaborator.name} size={18} />
                                             <span className="text-white truncate max-w-[100px]">{collaborator.name}</span>
                                             <button
                                                  type="button"
                                                  onClick={(e) => handleRemoveCollaborator(collaborator.id, e)}
                                                  className="text-slate-400 hover:text-red-400 transition-colors"
                                             >
                                                  <FiX className="w-3.5 h-3.5" />
                                             </button>
                                        </span>
                                   ))
                              )}
                         </div>
                         <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-2 shrink-0"
                         >
                              <FiChevronDown className="w-5 h-5 text-slate-400" />
                         </motion.div>
                    </div>
               </button>

               <AnimatePresence>
                    {isOpen && (
                         <motion.ul
                              className="absolute z-50 mt-1 w-full bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-auto"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              role="listbox"
                         >
                              {filteredUsers.length === 0 ? (
                                   <li className="px-4 py-3 text-slate-500 text-sm text-center">
                                        Brak dostępnych użytkowników
                                   </li>
                              ) : (
                                   filteredUsers.map((user) => {
                                        const selected = isSelected(user.id);
                                        return (
                                             <li
                                                  key={user.id}
                                                  className={`px-4 py-2 cursor-pointer flex items-center gap-3 transition-colors duration-150 ${
                                                       selected
                                                            ? 'bg-purple-600/20 text-white'
                                                            : 'text-slate-300 hover:bg-slate-700'
                                                  }`}
                                                  onClick={() => handleToggleCollaborator(user.id)}
                                                  role="option"
                                                  aria-selected={selected}
                                             >
                                                  <div
                                                       className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                            selected
                                                                 ? 'bg-purple-600 border-purple-600'
                                                                 : 'border-slate-500 bg-transparent'
                                                       }`}
                                                  >
                                                       {selected && <FiCheck className="w-3.5 h-3.5 text-white" />}
                                                  </div>
                                                  <Avatar src={user.image || ''} alt={user.name} size={24} />
                                                  <div className="flex flex-col truncate min-w-0">
                                                       <span className="truncate">{user.name}</span>
                                                       <span className="text-slate-400 text-xs truncate">{user.email}</span>
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

export default CollaboratorsSelector;

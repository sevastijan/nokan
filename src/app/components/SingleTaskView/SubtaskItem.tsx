'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaTrash, FaGripVertical } from 'react-icons/fa';
import { Task, User } from '@/app/types/globalTypes';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface SubtaskItemProps {
     subtask: Task;
     onToggleComplete: (subtaskId: string, completed: boolean) => void;
     onDelete: (subtaskId: string) => void;
     onOpen?: (subtaskId: string) => void;
     isDragging?: boolean;
     dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

const SubtaskItem = ({ subtask, onToggleComplete, onDelete, onOpen, isDragging = false, dragHandleProps }: SubtaskItemProps) => {
     const [isHovered, setIsHovered] = useState(false);
     const [isDeleting, setIsDeleting] = useState(false);

     const handleToggle = (e: React.MouseEvent) => {
          e.stopPropagation();
          onToggleComplete(subtask.id, !subtask.completed);
     };

     const handleDelete = async (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isDeleting) return;

          setIsDeleting(true);
          try {
               await onDelete(subtask.id);
          } finally {
               setIsDeleting(false);
          }
     };

     const handleClick = () => {
          if (onOpen) {
               onOpen(subtask.id);
          }
     };

     // Get collaborators or assignee for avatar display
     const collaborators = (subtask.collaborators as User[]) || [];
     const assignees = collaborators.length > 0 ? collaborators : subtask.assignee ? [subtask.assignee] : [];

     return (
          <motion.div
               layout
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className={`
                    group flex items-center gap-2 p-2 rounded-lg
                    transition-colors duration-150 cursor-pointer
                    ${isDragging ? 'bg-slate-600 shadow-lg' : 'hover:bg-slate-700/50'}
                    ${subtask.completed ? 'opacity-60' : ''}
               `}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}
               onClick={handleClick}
          >
               {/* Drag handle */}
               <div {...dragHandleProps} className="cursor-grab text-slate-500 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaGripVertical className="w-3 h-3" />
               </div>

               {/* Checkbox */}
               <button
                    onClick={handleToggle}
                    className={`
                         flex-shrink-0 w-5 h-5 rounded border-2
                         flex items-center justify-center
                         transition-all duration-150
                         ${subtask.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 hover:border-purple-400'}
                    `}
               >
                    {subtask.completed && (
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                         </svg>
                    )}
               </button>

               {/* Title */}
               <span
                    className={`
                         flex-1 text-sm truncate
                         ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-200'}
                    `}
               >
                    {subtask.title}
               </span>

               {/* Assignee avatars */}
               {assignees.length > 0 && (
                    <div className="flex -space-x-1">
                         {assignees.slice(0, 2).map((user) => (
                              <div key={user.id} className="w-5 h-5 rounded-full bg-slate-600 border border-slate-700 flex items-center justify-center overflow-hidden" title={user.name ?? undefined}>
                                   {user.image ? (
                                        <Image src={user.image} alt={user.name ?? 'User'} width={20} height={20} className="w-full h-full object-cover" />
                                   ) : (
                                        <span className="text-[10px] text-slate-300 font-medium">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                   )}
                              </div>
                         ))}
                         {assignees.length > 2 && (
                              <div className="w-5 h-5 rounded-full bg-slate-600 border border-slate-700 flex items-center justify-center">
                                   <span className="text-[10px] text-slate-300">+{assignees.length - 2}</span>
                              </div>
                         )}
                    </div>
               )}

               {/* Delete button */}
               <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`
                         flex-shrink-0 p-1 rounded text-slate-500
                         hover:text-red-400 hover:bg-red-400/10
                         transition-all duration-150
                         ${isHovered ? 'opacity-100' : 'opacity-0'}
                         ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
               >
                    <FaTrash className="w-3 h-3" />
               </button>
          </motion.div>
     );
};

export default SubtaskItem;

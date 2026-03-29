'use client';

import { motion } from 'framer-motion';
import { FiCheck, FiTrash2 } from 'react-icons/fi';
import { FaGripVertical } from 'react-icons/fa';
import { Task, User } from '@/app/types/globalTypes';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import Avatar from '../Avatar/Avatar';

interface SubtaskItemProps {
     subtask: Task;
     onToggleComplete: (subtaskId: string, completed: boolean) => void;
     onDelete: (subtaskId: string) => void;
     onOpen?: (subtaskId: string) => void;
     isDragging?: boolean;
     dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

const SubtaskItem = ({ subtask, onToggleComplete, onDelete, onOpen, isDragging = false, dragHandleProps }: SubtaskItemProps) => {
     const collaborators = (subtask.collaborators as User[]) || [];
     const assignees = collaborators.length > 0 ? collaborators : subtask.assignee ? [subtask.assignee] : [];

     return (
          <motion.div
               layout
               initial={{ opacity: 0, y: -5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, height: 0 }}
               className={`group flex items-center gap-2 py-1.5 cursor-pointer transition ${
                    isDragging ? 'bg-slate-800 rounded-lg px-2 shadow-lg' : ''
               }`}
               onClick={() => onOpen?.(subtask.id)}
          >
               {/* Drag handle */}
               <div
                    {...dragHandleProps}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
               >
                    <FaGripVertical className="w-3 h-3 text-slate-600" />
               </div>

               {/* Checkbox */}
               <button
                    onClick={(e) => { e.stopPropagation(); onToggleComplete(subtask.id, !subtask.completed); }}
                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
                         subtask.completed
                              ? 'bg-brand-500 border-brand-500'
                              : 'border-slate-600 hover:border-slate-400'
                    }`}
               >
                    {subtask.completed && <FiCheck className="w-2.5 h-2.5 text-white" />}
               </button>

               {/* Title */}
               <span className={`flex-1 text-sm truncate transition ${
                    subtask.completed ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-slate-100'
               }`}>
                    {subtask.title}
               </span>

               {/* Assignees */}
               {assignees.length > 0 && (
                    <div className="flex -space-x-1 shrink-0">
                         {assignees.slice(0, 2).map((user) => {
                              const img = (user as User).custom_image || user.image || '';
                              const name = (user as User).custom_name || user.name || '';
                              return <Avatar key={user.id} src={img} alt={name} size={18} />;
                         })}
                    </div>
               )}

               {/* Delete */}
               <button
                    onClick={(e) => { e.stopPropagation(); onDelete(subtask.id); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition p-0.5"
               >
                    <FiTrash2 className="w-3 h-3" />
               </button>
          </motion.div>
     );
};

export default SubtaskItem;

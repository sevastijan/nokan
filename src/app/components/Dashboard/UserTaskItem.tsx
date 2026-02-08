'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Check } from 'lucide-react';
import Avatar from '@/app/components/Avatar/Avatar';
import { getPriorityStyleConfig } from '@/app/utils/helpers';
import type { UserTask } from '@/app/store/endpoints/taskEndpoints';

interface UserTaskItemProps {
     task: UserTask;
     onToggleComplete: (taskId: string, completed: boolean) => void;
}

export const UserTaskItem = ({ task, onToggleComplete }: UserTaskItemProps) => {
     const router = useRouter();

     const priorityStyle = task.priority_info ? getPriorityStyleConfig(task.priority_info.label) : null;

     const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();

     const formatDueDate = (date: string) => {
          const d = new Date(date);
          const now = new Date();
          const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) return 'Dzisiaj';
          if (diffDays === 1) return 'Jutro';
          if (diffDays === -1) return 'Wczoraj';
          if (diffDays < -1) return `${Math.abs(diffDays)} dni temu`;
          if (diffDays <= 7) return `Za ${diffDays} dni`;

          return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
     };

     const handleClick = () => {
          router.push(`/board/${task.board_id}?task=${task.id}`);
     };

     const visibleCollaborators = task.collaborators.slice(0, 3);
     const overflowCount = task.collaborators.length - 3;

     return (
          <motion.div
               layout
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -8 }}
               className="group relative cursor-pointer bg-slate-800/60 border border-slate-700/50 rounded-xl hover:bg-slate-800/90 hover:border-slate-600/50 transition-all duration-200 overflow-hidden"
               onClick={handleClick}
          >
               {/* Priority color bar */}
               <div className="absolute left-0 top-0 bottom-0 w-0.75 rounded-l-xl" style={{ backgroundColor: priorityStyle?.dotColor || '#475569' }} />

               <div className="flex items-center gap-4 py-3 pl-5 pr-4">
                    {/* Completion toggle */}
                    <button
                         onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(task.id, !task.completed);
                         }}
                         className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              task.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 hover:border-slate-400 text-transparent hover:text-slate-500'
                         }`}
                         aria-label={task.completed ? 'Oznacz jako nieukończone' : 'Oznacz jako ukończone'}
                    >
                         <Check className="w-3 h-3" />
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                         <p className={`text-sm font-medium truncate ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
                    </div>

                    {/* Board badge */}
                    <span className="hidden sm:inline-flex shrink-0 items-center px-2 py-0.5 rounded-md bg-slate-700/50 border border-slate-600/30 text-xs text-slate-400 max-w-35 truncate">
                         {task.board_title}
                    </span>

                    {/* Due date */}
                    {task.due_date && (
                         <span className={`hidden md:inline-flex shrink-0 items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(task.due_date)}
                         </span>
                    )}

                    {/* Priority badge */}
                    {task.priority_info && (
                         <span
                              className={`hidden lg:inline-flex shrink-0 items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${priorityStyle?.bgColor} ${priorityStyle?.textColor} ${priorityStyle?.borderColor}`}
                         >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityStyle?.dotColor }} />
                              {task.priority_info.label}
                         </span>
                    )}

                    {/* Collaborator avatars */}
                    {visibleCollaborators.length > 0 && (
                         <div className="hidden lg:flex items-center -space-x-1.5 shrink-0">
                              {visibleCollaborators.map((collab) => (
                                   <Avatar key={collab.id} src={collab.custom_image || collab.image || undefined} alt={collab.custom_name || collab.name} size={24} className="ring-2 ring-slate-800" />
                              ))}
                              {overflowCount > 0 && (
                                   <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                                        +{overflowCount}
                                   </div>
                              )}
                         </div>
                    )}
               </div>
          </motion.div>
     );
};

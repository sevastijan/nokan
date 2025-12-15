'use client';

import { FaRedo, FaLayerGroup } from 'react-icons/fa';
import { FiCheckSquare, FiCornerDownRight } from 'react-icons/fi';
import Avatar from '../Avatar/Avatar';
import { Column, TaskType } from '@/app/types/globalTypes';
import { calculateDuration, formatDate } from '@/app/utils/helpers';

interface TaskMetadataSidebarProps {
     task: {
          creator: {
               id?: string;
               name?: string | null;
               image?: string | null;
               custom_name?: string | null;
               custom_image?: string | null;
               email?: string | null;
          } | null;
          created_at?: string | null;
          updated_at?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_recurring?: boolean;
          recurrence_interval?: number | null;
          recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
          collaborators?: Array<{
               id: string;
               name?: string | null;
               image?: string | null;
               custom_name?: string | null;
               custom_image?: string | null;
               email?: string | null;
          }> | null;
          type?: TaskType;
          parent_id?: string | null;
     };
     columns: Column[];
     selectedAssignees?: TaskMetadataSidebarProps['task']['collaborators'];
     localColumnId?: string;
     onRecurringModalOpen: () => void;
     onOpenTask?: (taskId: string) => void;
}

const getDisplayData = (
     user: {
          name?: string | null;
          image?: string | null;
          custom_name?: string | null;
          custom_image?: string | null;
          email?: string | null;
     } | null,
) => {
     if (!user) {
          return { name: 'Nieznany', image: '' };
     }

     return {
          name: user.custom_name || user.name || user.email || 'User',
          image: user.custom_image || user.image || '',
     };
};

const TaskMetadataSidebar = ({ task, columns, selectedAssignees = [], localColumnId, onRecurringModalOpen, onOpenTask }: TaskMetadataSidebarProps) => {
     const currentColumnTitle = columns.find((c) => c.id === localColumnId)?.title || '—';

     const isSubtask = Boolean(task.parent_id);
     const taskType = task.type || 'task';
     const isStory = taskType === 'story';

     const duration = task.start_date && task.end_date ? calculateDuration(task.start_date, task.end_date) : null;

     const assignees = selectedAssignees || [];

     return (
          <aside className="w-full md:w-72 bg-slate-800/70 border-t md:border-t-0 md:border-l border-slate-600 overflow-y-auto p-4 sm:p-6 text-white flex-shrink-0">
               <div className="mb-6">
                    <h3 className="text-sm text-slate-300 uppercase mb-2">Przypisani {assignees.length > 0 && `(${assignees.length})`}</h3>
                    {assignees.length > 0 ? (
                         <div className="space-y-2">
                              {assignees.map((assignee) => {
                                   const { name, image } = getDisplayData(assignee);
                                   return (
                                        <div key={assignee.id} className="flex items-center bg-slate-700 p-2 rounded-lg">
                                             <Avatar src={image} alt={name} size={28} className="mr-2 border border-white/20" />
                                             <div className="flex flex-col min-w-0">
                                                  <span className="text-white text-sm font-medium truncate">{name}</span>
                                                  <span className="text-slate-400 text-xs truncate">{assignee.email || '-'}</span>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    ) : (
                         <div className="text-slate-400">Brak przypisania</div>
                    )}
               </div>

               <div className="mb-6">
                    <h3 className="text-sm text-slate-300 uppercase mb-2">Autor zadania</h3>
                    {task.creator ? (
                         <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                              {(() => {
                                   const { name, image } = getDisplayData(task.creator);
                                   return (
                                        <>
                                             <Avatar src={image} alt={name} size={32} className="mr-3 border-2 border-white/20" />
                                             <div className="flex flex-col min-w-0">
                                                  <span className="text-white font-medium truncate">{name}</span>
                                                  <span className="text-slate-400 text-sm truncate">{task.creator.email || '-'}</span>
                                             </div>
                                        </>
                                   );
                              })()}
                         </div>
                    ) : (
                         <div className="text-slate-400">Nieznany</div>
                    )}
               </div>

               <div className="mb-6">
                    <h3 className="text-sm text-slate-300 uppercase mb-2">Utworzono</h3>
                    <div className="text-sm">{task.created_at ? formatDate(task.created_at) : '-'}</div>
               </div>

               <div className="mb-6">
                    <h3 className="text-sm text-slate-300 uppercase mb-2">Ostatnia aktualizacja</h3>
                    <div className="text-sm">{task.updated_at ? formatDate(task.updated_at) : '-'}</div>
               </div>

               <div className="mb-6">
                    <h3 className="text-sm text-slate-300 uppercase mb-2">Kolumna</h3>
                    <div className="text-sm truncate">{currentColumnTitle}</div>
               </div>

               <div className="mb-6">
                    <h3 className="text-sm text-slate-300 uppercase mb-2">Typ</h3>
                    {isSubtask ? (
                         <div className="space-y-2">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-300 rounded-lg text-sm font-medium">
                                   <FiCornerDownRight className="w-4 h-4" />
                                   Subtask
                              </div>
                              {task.parent_id && onOpenTask && (
                                   <button
                                        onClick={() => onOpenTask(task.parent_id!)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors"
                                   >
                                        <FaLayerGroup className="w-4 h-4" />
                                        <span>Zobacz Story</span>
                                   </button>
                              )}
                         </div>
                    ) : isStory ? (
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium">
                              <FaLayerGroup className="w-4 h-4" />
                              Story
                         </div>
                    ) : (
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium">
                              <FiCheckSquare className="w-4 h-4" />
                              Task
                         </div>
                    )}
               </div>

               {duration !== null && (
                    <div className="mb-6">
                         <h3 className="text-sm text-slate-300 uppercase mb-2">Czas trwania</h3>
                         <div className="text-sm">
                              {duration} {duration === 1 ? 'dzień' : 'dni'}
                         </div>
                    </div>
               )}

               <div className="mb-6 border-t border-slate-600 pt-6">
                    <button
                         onClick={onRecurringModalOpen}
                         className="w-full flex items-center justify-center gap-4 px-4 py-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                         aria-label="Ustawienia zadania cyklicznego"
                    >
                         <FaRedo className={`w-6 h-6 flex-shrink-0 ${task.is_recurring ? 'text-purple-400' : 'text-slate-400'}`} />
                         <div className="text-left">
                              <span className="font-medium block text-white">{task.is_recurring ? 'Zadanie cykliczne (włączone)' : 'Zadanie cykliczne'}</span>
                              {task.is_recurring && task.recurrence_interval && task.recurrence_type && (
                                   <span className="text-xs text-purple-300 block mt-1">
                                        co {task.recurrence_interval}{' '}
                                        {task.recurrence_type === 'daily' ? 'dzień' : task.recurrence_type === 'weekly' ? 'tydzień' : task.recurrence_type === 'monthly' ? 'miesiąc' : 'rok'}
                                   </span>
                              )}
                         </div>
                    </button>
               </div>
          </aside>
     );
};

export default TaskMetadataSidebar;

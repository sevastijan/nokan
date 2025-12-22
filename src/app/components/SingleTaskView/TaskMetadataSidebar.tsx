'use client';

import { FaRedo, FaLayerGroup } from 'react-icons/fa';
import { FiCheckSquare, FiCornerDownRight, FiClock, FiCalendar, FiUser, FiUsers, FiFolder } from 'react-icons/fi';
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
          <aside className="w-full md:w-80 bg-linear-to-b from-slate-800/90 to-slate-850/90 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-700/50 overflow-y-auto text-white shrink-0">
               <div className="p-6 space-y-6">
                    <div className="group">
                         <div className="flex items-center gap-2 mb-3">
                              <FiUsers className="w-4 h-4 text-blue-400" />
                              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                   Przypisani {assignees.length > 0 && <span className="text-blue-400">({assignees.length})</span>}
                              </h3>
                         </div>
                         {assignees.length > 0 ? (
                              <div className="space-y-2">
                                   {assignees.map((assignee) => {
                                        const { name, image } = getDisplayData(assignee);
                                        return (
                                             <div key={assignee.id} className="flex items-center gap-3 bg-slate-700/50 p-3 rounded-xl border border-slate-600/30">
                                                  <Avatar src={image} alt={name} size={36} className="border-2 border-blue-400/30 ring-2 ring-blue-400/10" />
                                                  <div className="flex flex-col min-w-0 flex-1">
                                                       <span className="text-white text-sm font-medium truncate">{name}</span>
                                                       <span className="text-slate-400 text-xs truncate">{assignee.email || '-'}</span>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                         ) : (
                              <div className="flex items-center justify-center py-6 px-4 bg-slate-700/30 rounded-xl border border-dashed border-slate-600/50">
                                   <span className="text-slate-400 text-sm">Brak przypisanych osób</span>
                              </div>
                         )}
                    </div>
                    <div className="group">
                         <div className="flex items-center gap-2 mb-3">
                              <FiUser className="w-4 h-4 text-purple-400" />
                              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Autor zadania</h3>
                         </div>
                         {task.creator ? (
                              <div className="flex items-center gap-3 bg-linear-to-br from-slate-700/60 to-slate-700/40 p-4 rounded-xl border border-slate-600/30">
                                   {(() => {
                                        const { name, image } = getDisplayData(task.creator);
                                        return (
                                             <>
                                                  <Avatar src={image} alt={name} size={40} className="border-2 border-purple-400/40 ring-2 ring-purple-400/10" />
                                                  <div className="flex flex-col min-w-0 flex-1">
                                                       <span className="text-white font-semibold truncate">{name}</span>
                                                       <span className="text-slate-400 text-sm truncate">{task.creator.email || '-'}</span>
                                                  </div>
                                             </>
                                        );
                                   })()}
                              </div>
                         ) : (
                              <div className="text-slate-400 text-sm bg-slate-700/30 p-3 rounded-xl">Nieznany</div>
                         )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                         <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <div className="flex items-center gap-2 mb-2">
                                   <FiCalendar className="w-4 h-4 text-green-400" />
                                   <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Utworzono</h3>
                              </div>
                              <div className="text-sm text-white font-medium">{task.created_at ? formatDate(task.created_at) : '-'}</div>
                         </div>

                         <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <div className="flex items-center gap-2 mb-2">
                                   <FiClock className="w-4 h-4 text-orange-400" />
                                   <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Ostatnia aktualizacja</h3>
                              </div>
                              <div className="text-sm text-white font-medium">{task.updated_at ? formatDate(task.updated_at) : '-'}</div>
                         </div>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                         <div className="flex items-center gap-2 mb-2">
                              <FiFolder className="w-4 h-4 text-cyan-400" />
                              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Kolumna</h3>
                         </div>
                         <div className="text-sm text-white font-medium truncate">{currentColumnTitle}</div>
                    </div>
                    <div>
                         <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Typ zadania</h3>
                         {isSubtask ? (
                              <div className="space-y-2">
                                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500/20 to-orange-600/20 text-orange-300 rounded-xl text-sm font-semibold border border-orange-500/30 shadow-lg shadow-orange-500/10">
                                        <FiCornerDownRight className="w-4 h-4" />
                                        Subtask
                                   </div>
                                   {task.parent_id && onOpenTask && (
                                        <button
                                             onClick={() => onOpenTask(task.parent_id!)}
                                             className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-300 rounded-xl text-sm font-medium transition-all duration-200 border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                             <FaLayerGroup className="w-4 h-4" />
                                             <span>Zobacz Story</span>
                                        </button>
                                   )}
                              </div>
                         ) : isStory ? (
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500/20 to-purple-600/20 text-purple-300 rounded-xl text-sm font-semibold border border-purple-500/30 shadow-lg shadow-purple-500/10">
                                   <FaLayerGroup className="w-4 h-4" />
                                   Story
                              </div>
                         ) : (
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500/20 to-blue-600/20 text-blue-300 rounded-xl text-sm font-semibold border border-blue-500/30 shadow-lg shadow-blue-500/10">
                                   <FiCheckSquare className="w-4 h-4" />
                                   Task
                              </div>
                         )}
                    </div>
                    {duration !== null && (
                         <div className="bg-linear-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-indigo-500/30 shadow-inner">
                              <div className="flex items-center gap-2 mb-2">
                                   <FiClock className="w-4 h-4 text-indigo-400" />
                                   <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Czas trwania</h3>
                              </div>
                              <div className="text-xl font-bold text-white">
                                   {duration} <span className="text-sm font-normal text-slate-300">{duration === 1 ? 'dzień' : 'dni'}</span>
                              </div>
                         </div>
                    )}
                    <div className="pt-4 border-t border-slate-700/50">
                         <button
                              onClick={onRecurringModalOpen}
                              className={`
                                   w-full group/recurring
                                   px-5 py-4 rounded-xl
                                   transition-all duration-300
                                   ${
                                        task.is_recurring
                                             ? 'bg-linear-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border-2 border-purple-500/40 shadow-lg shadow-purple-500/20'
                                             : 'bg-slate-700/40 hover:bg-slate-700/60 border-2 border-slate-600/30 hover:border-purple-500/30'
                                   }
                                   hover:scale-[1.02] active:scale-[0.98]
                              `}
                              aria-label="Ustawienia zadania cyklicznego"
                         >
                              <div className="flex items-center gap-4">
                                   <div
                                        className={`
                                        p-3 rounded-xl transition-all duration-300
                                        ${task.is_recurring ? 'bg-purple-500/20 group-hover/recurring:bg-purple-500/30' : 'bg-slate-600/30 group-hover/recurring:bg-purple-500/20'}
                                   `}
                                   >
                                        <FaRedo
                                             className={`w-5 h-5 transition-all duration-300 ${
                                                  task.is_recurring ? 'text-purple-300 group-hover/recurring:rotate-180' : 'text-slate-400 group-hover/recurring:text-purple-400'
                                             }`}
                                        />
                                   </div>
                                   <div className="text-left flex-1">
                                        <span className="font-semibold block text-white text-sm">{task.is_recurring ? 'Zadanie cykliczne' : 'Ustaw cykliczność'}</span>
                                        {task.is_recurring && task.recurrence_interval && task.recurrence_type ? (
                                             <span className="text-xs text-purple-300 block mt-1 font-medium">
                                                  co {task.recurrence_interval}{' '}
                                                  {task.recurrence_type === 'daily' ? 'dzień' : task.recurrence_type === 'weekly' ? 'tydzień' : task.recurrence_type === 'monthly' ? 'miesiąc' : 'rok'}
                                             </span>
                                        ) : (
                                             <span className="text-xs text-slate-400 block mt-1">Kliknij, aby skonfigurować</span>
                                        )}
                                   </div>
                              </div>
                         </button>
                    </div>
               </div>
          </aside>
     );
};

export default TaskMetadataSidebar;

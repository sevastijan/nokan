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
          <aside className="w-full md:w-72 lg:w-80 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-700/30 overflow-y-auto text-white shrink-0 thin-scrollbar">
               {/* Sidebar Header */}
               <div className="px-5 py-4 border-b border-slate-700/30 bg-slate-800/50">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                         Szczegóły
                    </h2>
               </div>

               <div className="p-4 space-y-4">
                    {/* Assignees Section */}
                    <div>
                         <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                   <FiUsers className="w-3.5 h-3.5 text-blue-400" />
                                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Przypisani</h3>
                              </div>
                              {assignees.length > 0 && (
                                   <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{assignees.length}</span>
                              )}
                         </div>
                         {assignees.length > 0 ? (
                              <div className="space-y-1.5">
                                   {assignees.map((assignee) => {
                                        const { name, image } = getDisplayData(assignee);
                                        return (
                                             <div key={assignee.id} className="flex items-center gap-2.5 bg-slate-700/30 p-2 rounded-lg border border-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                                  <Avatar src={image} alt={name} size={28} className="ring-2 ring-blue-400/20" />
                                                  <div className="flex flex-col min-w-0 flex-1">
                                                       <span className="text-white text-sm font-medium truncate">{name}</span>
                                                       <span className="text-slate-500 text-xs truncate">{assignee.email || '-'}</span>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                         ) : (
                              <div className="flex items-center justify-center py-3 px-3 bg-slate-700/20 rounded-lg border border-dashed border-slate-600/30">
                                   <span className="text-slate-500 text-xs">Brak przypisanych</span>
                              </div>
                         )}
                    </div>

                    {/* Creator Section */}
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                              <FiUser className="w-3.5 h-3.5 text-purple-400" />
                              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autor</h3>
                         </div>
                         {task.creator ? (
                              <div className="flex items-center gap-2.5 bg-slate-700/30 p-2.5 rounded-lg border border-slate-700/30">
                                   {(() => {
                                        const { name, image } = getDisplayData(task.creator);
                                        return (
                                             <>
                                                  <Avatar src={image} alt={name} size={32} className="ring-2 ring-purple-400/20" />
                                                  <div className="flex flex-col min-w-0 flex-1">
                                                       <span className="text-white text-sm font-medium truncate">{name}</span>
                                                       <span className="text-slate-500 text-xs truncate">{task.creator.email || '-'}</span>
                                                  </div>
                                             </>
                                        );
                                   })()}
                              </div>
                         ) : (
                              <div className="text-slate-500 text-xs bg-slate-700/20 p-2.5 rounded-lg">Nieznany</div>
                         )}
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-2">
                         <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                   <FiCalendar className="w-3 h-3 text-green-400" />
                                   <h3 className="text-[10px] font-semibold text-slate-500 uppercase">Utworzono</h3>
                              </div>
                              <div className="text-xs text-white font-medium">{task.created_at ? formatDate(task.created_at) : '-'}</div>
                         </div>
                         <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700/30">
                              <div className="flex items-center gap-1.5 mb-1">
                                   <FiClock className="w-3 h-3 text-orange-400" />
                                   <h3 className="text-[10px] font-semibold text-slate-500 uppercase">Aktualizacja</h3>
                              </div>
                              <div className="text-xs text-white font-medium">{task.updated_at ? formatDate(task.updated_at) : '-'}</div>
                         </div>
                    </div>

                    {/* Column */}
                    <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700/30">
                         <div className="flex items-center gap-1.5 mb-1">
                              <FiFolder className="w-3 h-3 text-cyan-400" />
                              <h3 className="text-[10px] font-semibold text-slate-500 uppercase">Kolumna</h3>
                         </div>
                         <div className="text-sm text-white font-medium truncate">{currentColumnTitle}</div>
                    </div>

                    {/* Task Type */}
                    <div>
                         <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Typ</h3>
                         {isSubtask ? (
                              <div className="space-y-2">
                                   <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/15 text-orange-300 rounded-lg text-xs font-semibold border border-orange-500/30">
                                        <FiCornerDownRight className="w-3.5 h-3.5" />
                                        Subtask
                                   </div>
                                   {task.parent_id && onOpenTask && (
                                        <button
                                             onClick={() => onOpenTask(task.parent_id!)}
                                             className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 rounded-lg text-xs font-medium transition-all duration-200 border border-purple-500/30"
                                        >
                                             <FaLayerGroup className="w-3.5 h-3.5" />
                                             <span>Zobacz Story</span>
                                        </button>
                                   )}
                              </div>
                         ) : isStory ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-semibold border border-purple-500/30">
                                   <FaLayerGroup className="w-3.5 h-3.5" />
                                   Story
                              </div>
                         ) : (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/15 text-blue-300 rounded-lg text-xs font-semibold border border-blue-500/30">
                                   <FiCheckSquare className="w-3.5 h-3.5" />
                                   Task
                              </div>
                         )}
                    </div>

                    {/* Duration */}
                    {duration !== null && (
                         <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                              <div className="flex items-center gap-1.5 mb-1">
                                   <FiClock className="w-3 h-3 text-indigo-400" />
                                   <h3 className="text-[10px] font-semibold text-slate-500 uppercase">Czas trwania</h3>
                              </div>
                              <div className="text-lg font-bold text-white">
                                   {duration} <span className="text-xs font-normal text-slate-400">{duration === 1 ? 'dzień' : 'dni'}</span>
                              </div>
                         </div>
                    )}

                    {/* Recurring Task Button */}
                    <div className="pt-3 border-t border-slate-700/30">
                         <button
                              onClick={onRecurringModalOpen}
                              className={`
                                   w-full group/recurring flex items-center gap-3 px-3 py-3 rounded-lg
                                   transition-all duration-200
                                   ${
                                        task.is_recurring
                                             ? 'bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25'
                                             : 'bg-slate-700/30 border border-slate-700/30 hover:bg-slate-700/50 hover:border-purple-500/30'
                                   }
                              `}
                         >
                              <div className={`p-2 rounded-lg transition-all duration-200 ${task.is_recurring ? 'bg-purple-500/20' : 'bg-slate-600/30 group-hover/recurring:bg-purple-500/15'}`}>
                                   <FaRedo className={`w-4 h-4 transition-all duration-200 ${task.is_recurring ? 'text-purple-300' : 'text-slate-400 group-hover/recurring:text-purple-400'}`} />
                              </div>
                              <div className="text-left flex-1">
                                   <span className="font-medium block text-white text-sm">{task.is_recurring ? 'Cykliczne' : 'Ustaw cykliczność'}</span>
                                   {task.is_recurring && task.recurrence_interval && task.recurrence_type ? (
                                        <span className="text-xs text-purple-300 block mt-0.5">
                                             co {task.recurrence_interval}{' '}
                                             {task.recurrence_type === 'daily' ? 'dzień' : task.recurrence_type === 'weekly' ? 'tyg.' : task.recurrence_type === 'monthly' ? 'mies.' : 'rok'}
                                        </span>
                                   ) : (
                                        <span className="text-xs text-slate-500 block mt-0.5">Kliknij, aby skonfigurować</span>
                                   )}
                              </div>
                         </button>
                    </div>
               </div>
          </aside>
     );
};

export default TaskMetadataSidebar;

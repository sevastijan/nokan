'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiList, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Column as ColumnType } from '@/app/types/globalTypes';
import Avatar from '@/app/components/Avatar/Avatar';

interface ListViewProps {
     onRemoveTask: (columnId: string, taskId: string) => Promise<void>;
     columns: ColumnType[];
     onOpenTaskDetail: (taskId: string) => void;
     priorities: Array<{ id: string; label: string; color: string }>;
}

// Strip HTML tags and decode entities
const stripHtml = (html: string): string => {
     if (!html) return '';
     // Remove HTML tags
     let text = html.replace(/<[^>]*>/g, '');
     // Decode common HTML entities
     text = text
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
     // Trim and collapse whitespace
     return text.replace(/\s+/g, ' ').trim();
};

const ListView = ({ columns, onOpenTaskDetail, priorities }: ListViewProps) => {
     const { t } = useTranslation();

     const sortedTasks = useMemo(() => {
          const allTasks = columns.flatMap((column) =>
               column.tasks.map((task) => ({
                    ...task,
                    columnTitle: column.title,
                    columnId: column.id,
               })),
          );
          return allTasks.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
     }, [columns]);

     const getPriority = (priorityId: string | null | undefined) => {
          if (!priorityId) return null;
          return priorities.find((p) => p.id === priorityId);
     };

     const formatDate = (dateStr: string | null | undefined) => {
          if (!dateStr) return '—';
          return new Date(dateStr).toLocaleDateString('pl-PL', {
               day: '2-digit',
               month: '2-digit',
               year: 'numeric',
          });
     };

     const getCollaborators = (task: (typeof sortedTasks)[0]) => {
          if (task.collaborators && task.collaborators.length > 0) {
               return task.collaborators.map((c) => ({
                    id: c.id,
                    name: c.custom_name || c.name || c.email || t('listView.defaultUser'),
                    image: c.custom_image || c.image || '',
               }));
          }
          if (task.assignee) {
               return [
                    {
                         id: task.assignee.id || 'assignee',
                         name: task.assignee.name || t('listView.defaultUser'),
                         image: task.assignee.image || '',
                    },
               ];
          }
          return [];
     };

     if (sortedTasks.length === 0) {
          return (
               <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-5xl mx-auto mt-8"
               >
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
                         <FiList className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                         <p className="text-lg font-medium text-slate-300 mb-1">{t('listView.noTasks')}</p>
                         <p className="text-sm text-slate-500">{t('listView.createFirstTask')}</p>
                    </div>
               </motion.div>
          );
     }

     return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="w-full max-w-5xl mx-auto">
               {/* Desktop Header */}
               <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4">{t('listView.task')}</div>
                    <div className="col-span-2">{t('listView.column')}</div>
                    <div className="col-span-2">{t('listView.priority')}</div>
                    <div className="col-span-2">{t('listView.assigned')}</div>
                    <div className="col-span-2">{t('listView.date')}</div>
               </div>

               {/* Tasks List */}
               <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                    {sortedTasks.map((task, index) => {
                         const priority = getPriority(task.priority);
                         const collaborators = getCollaborators(task);
                         const description = stripHtml(task.description || '');

                         return (
                              <motion.div
                                   key={task.id}
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: index * 0.02, duration: 0.2 }}
                                   onClick={() => onOpenTaskDetail(task.id)}
                                   className={`
                                        px-5 py-4 cursor-pointer transition-colors
                                        hover:bg-slate-700/30
                                        ${index !== sortedTasks.length - 1 ? 'border-b border-slate-700/30' : ''}
                                   `}
                              >
                                   {/* Desktop Layout */}
                                   <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                        {/* Task Title */}
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                             <div
                                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                                       task.completed ? 'bg-green-500' : task.type === 'story' ? 'bg-purple-500' : 'bg-purple-500'
                                                  }`}
                                             />
                                             <span className="text-slate-200 font-medium truncate">{task.title}</span>
                                        </div>

                                        {/* Column */}
                                        <div className="col-span-2">
                                             <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">{task.columnTitle}</span>
                                        </div>

                                        {/* Priority */}
                                        <div className="col-span-2">
                                             {priority ? (
                                                  <span
                                                       className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded"
                                                       style={{
                                                            backgroundColor: priority.color + '20',
                                                            color: priority.color,
                                                       }}
                                                  >
                                                       <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
                                                       {priority.label}
                                                  </span>
                                             ) : (
                                                  <span className="text-slate-600 text-xs">—</span>
                                             )}
                                        </div>

                                        {/* Assignees */}
                                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                                             {collaborators.length > 0 ? (
                                                  <div className="flex items-center">
                                                       <div className="flex -space-x-2">
                                                            {collaborators.slice(0, 3).map((person, idx) => (
                                                                 <div key={person.id} style={{ zIndex: 3 - idx }}>
                                                                      <Avatar src={person.image} alt={person.name} size={24} className="border-2 border-slate-800" />
                                                                 </div>
                                                            ))}
                                                            {collaborators.length > 3 && (
                                                                 <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-medium">
                                                                      +{collaborators.length - 3}
                                                                 </div>
                                                            )}
                                                       </div>
                                                       {collaborators.length === 1 && (
                                                            <span className="text-sm text-slate-300 truncate ml-2">{collaborators[0].name}</span>
                                                       )}
                                                  </div>
                                             ) : (
                                                  <span className="text-slate-600 text-xs">—</span>
                                             )}
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-2 text-sm text-slate-500">{formatDate(task.created_at)}</div>
                                   </div>

                                   {/* Mobile Layout */}
                                   <div className="md:hidden space-y-3">
                                        {/* Title row */}
                                        <div className="flex items-start gap-3">
                                             <div
                                                  className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                                                       task.completed ? 'bg-green-500' : task.type === 'story' ? 'bg-purple-500' : 'bg-purple-500'
                                                  }`}
                                             />
                                             <div className="flex-1 min-w-0">
                                                  <h3 className="text-slate-100 font-medium">{task.title}</h3>

                                                  {/* Badges */}
                                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                                       <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">{task.columnTitle}</span>
                                                       {priority && (
                                                            <span
                                                                 className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                                                                 style={{
                                                                      backgroundColor: priority.color + '20',
                                                                      color: priority.color,
                                                                 }}
                                                            >
                                                                 <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priority.color }} />
                                                                 {priority.label}
                                                            </span>
                                                       )}
                                                  </div>

                                                  {/* Meta row */}
                                                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                                       {collaborators.length > 0 && (
                                                            <div className="flex items-center gap-1.5">
                                                                 <div className="flex -space-x-1.5">
                                                                      {collaborators.slice(0, 3).map((person, idx) => (
                                                                           <div key={person.id} style={{ zIndex: 3 - idx }}>
                                                                                <Avatar src={person.image} alt={person.name} size={18} className="border border-slate-800" />
                                                                           </div>
                                                                      ))}
                                                                      {collaborators.length > 3 && (
                                                                           <div className="w-4 h-4 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[9px] text-slate-300 font-medium">
                                                                                +{collaborators.length - 3}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                                 {collaborators.length <= 2 && (
                                                                      <span className="text-slate-400">{collaborators.map((c) => c.name).join(', ')}</span>
                                                                 )}
                                                            </div>
                                                       )}
                                                       <div className="flex items-center gap-1">
                                                            <FiCalendar className="w-3 h-3" />
                                                            <span>{formatDate(task.created_at)}</span>
                                                       </div>
                                                  </div>

                                                  {/* Description preview */}
                                                  {description && (
                                                       <p className="text-xs text-slate-500 mt-2 line-clamp-2">{description}</p>
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              </motion.div>
                         );
                    })}
               </div>
          </motion.div>
     );
};

export default ListView;

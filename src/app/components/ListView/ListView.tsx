import { FiList } from 'react-icons/fi';
import Image from 'next/image';
import { Column as ColumnType } from '@/app/types/globalTypes';

interface ListViewProps {
     onRemoveTask: (columnId: string, taskId: string) => Promise<void>;
     columns: ColumnType[];
     onOpenTaskDetail: (taskId: string) => void;
     priorities: Array<{ id: string; label: string; color: string }>;
}

const ListView = ({ columns, onOpenTaskDetail, priorities }: ListViewProps) => {
     const allTasks = columns.flatMap((column) =>
          column.tasks.map((task) => ({
               ...task,
               columnTitle: column.title,
               columnId: column.id,
          })),
     );

     const sortedTasks = allTasks.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

     return (
          <div className="w-full max-w-7xl mx-auto bg-slate-800/80 rounded-2xl border border-slate-700/70 shadow-xl overflow-hidden mt-6">
               <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-700/50 bg-slate-700/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <div className="col-span-3">Task</div>
                    <div className="col-span-2">Column</div>
                    <div className="col-span-2">Priority</div>
                    <div className="col-span-3">Assignee</div>
                    <div className="col-span-2">Created</div>
               </div>

               {sortedTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                         <FiList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                         <p className="text-lg font-medium mb-2">No tasks found</p>
                         <p className="text-sm">Create your first task to get started</p>
                    </div>
               ) : (
                    sortedTasks.map((task) => (
                         <div
                              key={task.id}
                              className={`
              border-b border-slate-700/40 
              px-4 py-5 md:px-6 md:py-4 
              hover:bg-slate-800/60 transition 
              cursor-pointer
              last:border-b-0
              flex flex-col gap-3
              md:grid md:grid-cols-12 md:gap-4 md:items-center
            `}
                              onClick={() => onOpenTaskDetail(task.id)}
                              tabIndex={0}
                         >
                              {/* DESKTOP */}
                              <div className="hidden md:flex md:col-span-3 font-semibold text-white items-center gap-2 min-w-0">
                                   <span className="truncate">{task.title}</span>
                                   <span className={`w-2.5 h-2.5 rounded-full ${task.completed ? 'bg-green-400/80' : 'bg-blue-400/70'} ml-2`} />
                              </div>
                              <div className="hidden md:flex md:col-span-2 items-center">
                                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">{task.columnTitle}</span>
                              </div>
                              <div className="hidden md:flex md:col-span-2 items-center">
                                   {task.priority && (
                                        <span
                                             className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border shadow"
                                             style={{
                                                  backgroundColor: priorities.find((p) => p.id === task.priority)?.color || '#FFD600',
                                                  color: '#fff',
                                                  borderColor: priorities.find((p) => p.id === task.priority)?.color || '#FFD600',
                                             }}
                                        >
                                             {priorities.find((p) => p.id === task.priority)?.label || task.priority}
                                        </span>
                                   )}
                              </div>
                              <div className="hidden md:flex md:col-span-3 items-center gap-2 min-w-0">
                                   {task.assignee?.image && (
                                        <Image src={task.assignee.image} alt={task.assignee.name ?? 'Assignee avatar'} width={22} height={22} className="rounded-full border border-slate-700" />
                                   )}
                                   <span className="text-slate-200 text-xs truncate">{task.assignee?.name || <span className="italic text-slate-500">Unassigned</span>}</span>
                              </div>
                              <div className="hidden md:flex md:col-span-2 text-slate-400 text-xs font-mono">{task.created_at ? new Date(task.created_at).toLocaleDateString() : '-'}</div>

                              <div className="md:hidden flex flex-col gap-2">
                                   <div className="flex items-center gap-2">
                                        <span className="text-white font-semibold text-lg">{task.title}</span>
                                        <span className={`w-2.5 h-2.5 rounded-full ${task.completed ? 'bg-green-400/80' : 'bg-blue-400/70'}`} />
                                   </div>
                                   <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-200 border border-slate-600 text-xs font-semibold shadow">
                                             {task.columnTitle}
                                        </span>
                                        {task.priority && (
                                             <span
                                                  className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border"
                                                  style={{
                                                       backgroundColor: priorities.find((p) => p.id === task.priority)?.color || '#FFD600',
                                                       color: '#fff',
                                                       borderColor: priorities.find((p) => p.id === task.priority)?.color || '#FFD600',
                                                  }}
                                             >
                                                  {priorities.find((p) => p.id === task.priority)?.label || task.priority}
                                             </span>
                                        )}
                                   </div>
                                   <div className="flex items-center gap-2 mt-2">
                                        {task.assignee?.image && (
                                             <Image src={task.assignee.image} alt={task.assignee.name ?? 'Assignee avatar'} width={20} height={20} className="rounded-full border border-slate-700" />
                                        )}
                                        <span className="text-slate-200 text-sm">{task.assignee?.name || <span className="italic text-slate-500">Unassigned</span>}</span>
                                   </div>
                                   <div className="text-slate-400 text-xs font-mono mt-1">{task.created_at ? new Date(task.created_at).toLocaleDateString() : '-'}</div>
                                   {task.description && <div className="text-xs text-slate-400 pt-2">{task.description}</div>}
                              </div>
                         </div>
                    ))
               )}
          </div>
     );
};

export default ListView;

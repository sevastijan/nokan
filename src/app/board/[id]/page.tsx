'use client';

import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/lib/supabase';
import { useBoard } from '@/app/hooks/useBoard';
import Column from '@/app/components/Column';
import AddColumnPopup from '@/app/components/TaskColumn/AddColumnPopup';
import SingleTaskView from '@/app/components/SingleTaskView/SingleTaskView';
import ListView from '@/app/components/ListView/ListView';
import Loader from '@/app/components/Loader';
import { extractTaskIdFromUrl } from '@/app/utils/helpers';
import { getPriorities } from '@/app/lib/api';
import { Column as ColumnType, User, Priority, AssigneeOption } from '@/app/types/globalTypes';
import BoardHeader from '@/app/components/Board/BoardHeader';

export default function Page() {
     const { id } = useParams();
     const router = useRouter();
     const { data: session, status } = useSession();

     const boardId = Array.isArray(id) ? id[0] : id;

     const {
          board,
          loading: boardLoading,
          error: boardError,
          fetchBoardData,
          handleUpdateBoardTitle,
          handleAddColumn,
          handleRemoveColumn,
          handleUpdateColumnTitle,
          handleAddTask,
          handleRemoveTask,
     } = useBoard(boardId || '');

     const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);
     const [boardTitle, setBoardTitle] = useState('');
     const [isPopupOpen, setIsPopupOpen] = useState(false);
     const [newColumnTitle, setNewColumnTitle] = useState('');
     const [isAddingColumn, setIsAddingColumn] = useState(false);
     const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
     const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
     const [currentUser, setCurrentUser] = useState<User | null>(null);
     const [priorities, setPriorities] = useState<Priority[]>([]);
     const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
     const [searchTerm, setSearchTerm] = useState('');
     const [filterPriority, setFilterPriority] = useState<string | null>(null);
     const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

     useEffect(() => {
          if (!board) return;
          setBoardTitle(board.title);
          const sortedCols = board.columns
               .map((c) => ({
                    ...c,
                    tasks: (c.tasks || []).map((t) => ({ ...t, order: t.sort_order ?? 0 })).sort((a, b) => a.order - b.order),
               }))
               .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setLocalColumns(sortedCols);
     }, [board]);

     useEffect(() => {
          getPriorities()
               .then(setPriorities)
               .catch(() => {
                    setPriorities([
                         { id: 'low', label: 'Niski', color: '#10b981' },
                         { id: 'medium', label: 'Średni', color: '#f59e0b' },
                         { id: 'high', label: 'Wysoki', color: '#ef4444' },
                         { id: 'urgent', label: 'Pilny', color: '#dc2626' },
                    ]);
               });
     }, []);

     useEffect(() => {
          if (!session?.user?.email) return;
          (async () => {
               const { data } = await supabase.from('users').select('*').eq('email', session.user.email).single();
               if (data) {
                    setCurrentUser({
                         id: data.id,
                         name: data.name!,
                         email: data.email,
                         image: data.image || undefined,
                         created_at: data.created_at!,
                    });
               } else {
                    const { data: newUser } = await supabase.from('users').insert({ email: session.user.email, name: session.user.name, image: session.user.image }).select().single();
                    setCurrentUser({
                         id: newUser.id,
                         name: newUser.name!,
                         email: newUser.email,
                         image: newUser.image || undefined,
                         created_at: newUser.created_at!,
                    });
               }
          })();
     }, [session]);

     useEffect(() => {
          if (status === 'unauthenticated') router.push('/auth/signin');
     }, [status, router]);

     useEffect(() => {
          if (typeof window === 'undefined') return;
          const taskId = extractTaskIdFromUrl(window.location.href);
          if (taskId) setSelectedTaskId(taskId);
     }, []);

     const onDragEnd = useCallback(
          async (result: DropResult) => {
               const { source, destination, type } = result;
               if (!destination) return;

               if (type === 'COLUMN') {
                    const cols = Array.from(localColumns);
                    const [moved] = cols.splice(source.index, 1);
                    cols.splice(destination.index, 0, moved);
                    setLocalColumns(cols);
                    await Promise.all(cols.map((c, i) => supabase.from('columns').update({ order: i }).eq('id', c.id)));
                    await fetchBoardData();
                    return;
               }

               if (type === 'TASK') {
                    const cols = Array.from(localColumns);
                    const srcCol = cols.find((c) => c.id === source.droppableId);
                    const dstCol = cols.find((c) => c.id === destination.droppableId);
                    if (!srcCol || !dstCol) return;

                    const srcTasks = Array.from(srcCol.tasks || []);
                    const [movedTask] = srcTasks.splice(source.index, 1);
                    if (!movedTask) return;

                    const dstTasks = srcCol.id === dstCol.id ? srcTasks : Array.from(dstCol.tasks || []);
                    dstTasks.splice(destination.index, 0, movedTask);

                    const updatedSrc = srcTasks.map((t, i) => ({ ...t, order: i }));
                    const updatedDst = dstTasks.map((t, i) => ({
                         ...t,
                         order: i,
                         column_id: dstCol.id,
                    }));

                    cols[cols.indexOf(srcCol)].tasks = updatedSrc;
                    cols[cols.indexOf(dstCol)].tasks = updatedDst;
                    setLocalColumns(cols);

                    await Promise.all([
                         ...updatedSrc.map((t) => supabase.from('tasks').update({ sort_order: t.order }).eq('id', t.id)),
                         ...updatedDst.map((t) => supabase.from('tasks').update({ sort_order: t.order, column_id: t.column_id }).eq('id', t.id)),
                    ]);

                    await fetchBoardData();
               }
          },
          [localColumns, fetchBoardData],
     );

     // Dopiero TERAZ możemy sprawdzać warunki i robić early return
     if (!boardId) {
          return (
               <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
                    <div className="text-center">
                         <h2 className="text-2xl font-bold text-red-400 mb-4">Brak ID boarda w URL</h2>
                         <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition">
                              Powrót do dashboardu
                         </button>
                    </div>
               </div>
          );
     }

     if (status === 'loading' || !session || !currentUser || boardLoading || !board) {
          return <Loader text="Ładowanie boarda..." />;
     }

     if (boardError) {
          return (
               <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
                    <div className="text-center">
                         <h2 className="text-2xl font-bold text-red-400 mb-4">Błąd ładowania boarda</h2>
                         <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition">
                              Powrót do dashboardu
                         </button>
                    </div>
               </div>
          );
     }

     const onBoardTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setBoardTitle(e.target.value);
     const onBoardTitleBlur = () => {
          const trimmed = boardTitle.trim();
          if (trimmed && trimmed !== board?.title) handleUpdateBoardTitle(trimmed);
     };

     const openAddColumn = () => setIsPopupOpen(true);
     const closeAddColumn = () => setIsPopupOpen(false);
     const onAddColumn = async () => {
          if (!newColumnTitle.trim()) return;
          setIsAddingColumn(true);
          await handleAddColumn(newColumnTitle.trim());
          setNewColumnTitle('');
          closeAddColumn();
          await fetchBoardData();
          setIsAddingColumn(false);
     };

     const openAddTask = (colId: string) => setAddTaskColumnId(colId);
     const onTaskAdded = async (columnId: string, title: string, priority?: string, userId?: string) => {
          const task = await handleAddTask(columnId, title, priority, userId);
          setLocalColumns((cols) => cols.map((c) => (c.id === columnId ? { ...c, tasks: [...(c.tasks || []), task] } : c)));
          setAddTaskColumnId(null);
          return task;
     };

     const onTaskRemoved = async (columnId: string, taskId: string) => {
          await handleRemoveTask(columnId, taskId);
          setLocalColumns((cols) => cols.map((c) => (c.id === columnId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c)));
     };

     const totalTasks = board.columns.reduce((sum, col) => sum + (col.tasks?.length || 0), 0);

     const assigneesList: AssigneeOption[] = [];
     board.columns.forEach((col) => {
          (col.tasks || []).forEach((task) => {
               if (task.assignee?.id && !assigneesList.find((a) => a.id === task.assignee!.id)) {
                    assigneesList.push({ id: task.assignee!.id, name: task.assignee!.name });
               }
          });
     });

     const filteredColumns = localColumns.map((col) => {
          const filteredTasks = (col.tasks || []).filter((task) => {
               if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    if (!task.title?.toLowerCase().includes(term) && !task.description?.toLowerCase().includes(term)) return false;
               }
               if (filterPriority && task.priority !== filterPriority) return false;
               if (filterAssignee && task.assignee?.id !== filterAssignee) return false;
               return true;
          });
          return { ...col, tasks: filteredTasks };
     });

     const currentColumnId = addTaskColumnId || (selectedTaskId ? localColumns.find((c) => c.tasks.some((t) => t.id === selectedTaskId))?.id : null);

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex flex-col">
               <BoardHeader
                    boardTitle={boardTitle}
                    onTitleChange={onBoardTitleChange}
                    onTitleBlur={onBoardTitleBlur}
                    onAddColumn={openAddColumn}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalTasks={totalTasks}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    priorities={priorities.map((p) => ({ id: p.id, label: p.label, color: p.color }))}
                    filterPriority={filterPriority}
                    onFilterPriorityChange={setFilterPriority}
                    assignees={assigneesList}
                    filterAssignee={filterAssignee}
                    onFilterAssigneeChange={setFilterAssignee}
               />

               {viewMode === 'columns' ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                         <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                              {(provider) => (
                                   <div
                                        ref={provider.innerRef}
                                        {...provider.droppableProps}
                                        className="flex-1 flex overflow-x-auto gap-4 p-4 md:p-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-700"
                                   >
                                        {filteredColumns.map((col, idx) => (
                                             <Draggable key={col.id} draggableId={col.id} index={idx}>
                                                  {(prov) => (
                                                       <div
                                                            ref={prov.innerRef}
                                                            {...prov.draggableProps}
                                                            style={prov.draggableProps.style}
                                                            className="flex-shrink-0 w-[88vw] sm:w-80 lg:w-96 snap-start"
                                                       >
                                                            <Column
                                                                 column={col}
                                                                 colIndex={idx}
                                                                 onUpdateColumnTitle={handleUpdateColumnTitle}
                                                                 onRemoveColumn={handleRemoveColumn}
                                                                 onTaskAdded={onTaskAdded}
                                                                 onRemoveTask={onTaskRemoved}
                                                                 onOpenTaskDetail={setSelectedTaskId}
                                                                 selectedTaskId={selectedTaskId}
                                                                 currentUser={currentUser}
                                                                 onOpenAddTask={openAddTask}
                                                                 priorities={priorities}
                                                                 dragHandleProps={prov.dragHandleProps ?? undefined}
                                                            />
                                                       </div>
                                                  )}
                                             </Draggable>
                                        ))}
                                        {provider.placeholder}
                                   </div>
                              )}
                         </Droppable>
                    </DragDropContext>
               ) : (
                    <div className="flex-1 overflow-auto p-6">
                         <ListView columns={filteredColumns} onOpenTaskDetail={setSelectedTaskId} onRemoveTask={onTaskRemoved} priorities={priorities} />
                    </div>
               )}

               <AddColumnPopup
                    isOpen={isPopupOpen}
                    onClose={closeAddColumn}
                    onAddColumn={onAddColumn}
                    newColumnTitle={newColumnTitle}
                    setNewColumnTitle={setNewColumnTitle}
                    isAddingColumn={isAddingColumn}
               />

               {(selectedTaskId || addTaskColumnId) && currentColumnId && (
                    <SingleTaskView
                         key={selectedTaskId ?? `add-${addTaskColumnId}`}
                         taskId={selectedTaskId!}
                         mode={selectedTaskId ? 'edit' : 'add'}
                         columns={localColumns}
                         boardId={boardId}
                         columnId={currentColumnId}
                         onClose={() => {
                              setSelectedTaskId(null);
                              setAddTaskColumnId(null);
                              fetchBoardData();
                         }}
                         onTaskUpdate={() => {
                              setSelectedTaskId(null);
                              fetchBoardData();
                         }}
                         onTaskAdded={() => {
                              setAddTaskColumnId(null);
                              fetchBoardData();
                         }}
                         currentUser={currentUser!}
                    />
               )}
          </div>
     );
}

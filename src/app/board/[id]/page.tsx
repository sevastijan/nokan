'use client';

import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getSupabase } from '@/app/lib/supabase';
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
     const params = useParams();
     const router = useRouter();
     const { data: session, status } = useSession();

     const boardId = Array.isArray(params.id) ? params.id[0] : params.id;

     const {
          board,
          statuses,
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

     const prevBoardIdRef = useRef<string | null>(null);
     const columnsContainerRef = useRef<HTMLDivElement>(null);
     const savedScrollPosition = useRef<{ x: number; y: number } | null>(null);
     const columnScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
     const savedColumnScrollPositions = useRef<Map<string, number>>(new Map());

     useEffect(() => {
          if (!board) return;

          if (prevBoardIdRef.current !== board.id) {
               prevBoardIdRef.current = board.id;
               setBoardTitle(board.title);
          }

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
               const { data } = await getSupabase().from('users').select('*').eq('email', session.user.email).single();
               if (data) {
                    setCurrentUser({
                         id: data.id,
                         name: data.name!,
                         email: data.email,
                         image: data.image || undefined,
                         created_at: data.created_at!,
                    });
               } else {
                    const { data: newUser } = await getSupabase().from('users').insert({ email: session.user.email, name: session.user.name, image: session.user.image }).select().single();
                    setCurrentUser({
                         id: newUser.id,
                         name: newUser.name!,
                         email: newUser.email,
                         image: newUser.image || undefined,
                         created_at: newUser.created_at!,
                    });
               }
          })();
     }, [session?.user?.email, session?.user?.name, session?.user?.image]);

     useEffect(() => {
          if (status === 'unauthenticated') router.push('/auth/signin');
     }, [status, router]);

     useEffect(() => {
          if (typeof window === 'undefined') return;
          const taskId = extractTaskIdFromUrl(window.location.href);
          if (taskId) setSelectedTaskId(taskId);
     }, []);

     const saveScrollPosition = useCallback(() => {
          if (columnsContainerRef.current) {
               savedScrollPosition.current = {
                    x: columnsContainerRef.current.scrollLeft,
                    y: columnsContainerRef.current.scrollTop,
               };
          }
          columnScrollRefs.current.forEach((el, colId) => {
               if (el) {
                    savedColumnScrollPositions.current.set(colId, el.scrollTop);
               }
          });
     }, []);

     const registerColumnScrollRef = useCallback((colId: string, el: HTMLDivElement | null) => {
          if (el) {
               columnScrollRefs.current.set(colId, el);
          } else {
               columnScrollRefs.current.delete(colId);
          }
     }, []);

     useLayoutEffect(() => {
          const restoreScroll = () => {
               if (savedScrollPosition.current && columnsContainerRef.current) {
                    columnsContainerRef.current.scrollLeft = savedScrollPosition.current.x;
                    columnsContainerRef.current.scrollTop = savedScrollPosition.current.y;
               }
               if (savedColumnScrollPositions.current.size > 0) {
                    savedColumnScrollPositions.current.forEach((scrollTop, colId) => {
                         const el = columnScrollRefs.current.get(colId);
                         if (el) {
                              el.scrollTop = scrollTop;
                         }
                    });
               }
          };

          restoreScroll();

          const timeouts = [0, 50, 100, 200].map((delay) => setTimeout(restoreScroll, delay));

          const clearTimeout2 = setTimeout(() => {
               savedScrollPosition.current = null;
               savedColumnScrollPositions.current.clear();
          }, 250);

          return () => {
               timeouts.forEach(clearTimeout);
               clearTimeout(clearTimeout2);
          };
     });

     const onDragEnd = useCallback(
          async (result: DropResult) => {
               const { source, destination, type } = result;
               if (!destination) return;
               if (source.droppableId === destination.droppableId && source.index === destination.index) return;

               if (type === 'COLUMN') {
                    const cols = Array.from(localColumns);
                    const [moved] = cols.splice(source.index, 1);
                    cols.splice(destination.index, 0, moved);
                    setLocalColumns(cols);

                    try {
                         const updates = await Promise.all(cols.map((c, i) => getSupabase().from('columns').update({ order: i }).eq('id', c.id)));
                         const hasError = updates.some((u) => u.error);
                         if (hasError) {
                              console.error('Error updating column order:', updates.find((u) => u.error)?.error);
                         }
                    } catch (err) {
                         console.error('Error updating column order:', err);
                    }
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

                    const isSameColumn = srcCol.id === dstCol.id;
                    const dstTasks = isSameColumn ? srcTasks : Array.from(dstCol.tasks || []);
                    dstTasks.splice(destination.index, 0, movedTask);

                    if (isSameColumn) {
                         const updatedTasks = dstTasks.map((t, i) => ({ ...t, order: i, sort_order: i }));
                         const srcColIndex = cols.findIndex((c) => c.id === srcCol.id);
                         cols[srcColIndex] = { ...cols[srcColIndex], tasks: updatedTasks };
                         setLocalColumns([...cols]);

                         try {
                              const updates = await Promise.all(updatedTasks.map((t) => getSupabase().from('tasks').update({ sort_order: t.order }).eq('id', t.id)));
                              const errors = updates.filter((u) => u.error);
                              if (errors.length > 0) {
                                   console.error(
                                        '[DnD] DB errors:',
                                        errors.map((e) => e.error),
                                   );
                              }
                         } catch (err) {
                              console.error('[DnD] Exception:', err);
                         }
                    } else {
                         const updatedSrc = srcTasks.map((t, i) => ({ ...t, order: i, sort_order: i }));
                         const updatedDst = dstTasks.map((t, i) => ({
                              ...t,
                              order: i,
                              sort_order: i,
                              column_id: dstCol.id,
                         }));

                         const srcColIndex = cols.findIndex((c) => c.id === srcCol.id);
                         const dstColIndex = cols.findIndex((c) => c.id === dstCol.id);
                         cols[srcColIndex] = { ...cols[srcColIndex], tasks: updatedSrc };
                         cols[dstColIndex] = { ...cols[dstColIndex], tasks: updatedDst };
                         setLocalColumns([...cols]);

                         try {
                              const updates = await Promise.all([
                                   ...updatedSrc.map((t) => getSupabase().from('tasks').update({ sort_order: t.order }).eq('id', t.id)),
                                   ...updatedDst.map((t) => getSupabase().from('tasks').update({ sort_order: t.order, column_id: t.column_id }).eq('id', t.id)),
                              ]);
                              const errors = updates.filter((u) => u.error);
                              if (errors.length > 0) {
                                   console.error(
                                        '[DnD] DB errors:',
                                        errors.map((e) => e.error),
                                   );
                              }
                         } catch (err) {
                              console.error('[DnD] Exception:', err);
                         }
                    }

                    await fetchBoardData();
               }
          },
          [localColumns, fetchBoardData],
     );

     if (!boardId) {
          return (
               <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    <div className="text-center">
                         <h2 className="text-2xl font-bold text-red-400 mb-4">Brak ID boarda w URL</h2>
                         <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
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
               <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    <div className="text-center">
                         <h2 className="text-2xl font-bold text-red-400 mb-4">Błąd ładowania boarda</h2>
                         <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
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

     const openAddTask = (colId: string) => {
          saveScrollPosition();
          setAddTaskColumnId(colId);
     };

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

     const handleOpenTaskDetail = (taskId: string) => {
          saveScrollPosition();
          setSelectedTaskId(taskId);
     };

     const handleCloseTaskView = () => {
          saveScrollPosition();
          setSelectedTaskId(null);
          setAddTaskColumnId(null);
          fetchBoardData();
     };

     return (
          <div className="min-h-screen bg-slate-900 flex flex-col">
               <BoardHeader
                    boardTitle={boardTitle}
                    onTitleChange={onBoardTitleChange}
                    onTitleBlur={onBoardTitleBlur}
                    onAddColumn={openAddColumn}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    priorities={priorities.map((p) => ({ id: p.id, label: p.label, color: p.color }))}
                    filterPriority={filterPriority}
                    onFilterPriorityChange={setFilterPriority}
                    assignees={assigneesList}
                    filterAssignee={filterAssignee}
                    onFilterAssigneeChange={setFilterAssignee}
                    boardId={boardId}
                    currentUserId={currentUser?.id}
               />

               {viewMode === 'columns' ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                         <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                              {(provider) => (
                                   <div
                                        ref={(el) => {
                                             provider.innerRef(el);
                                             columnsContainerRef.current = el;
                                        }}
                                        {...provider.droppableProps}
                                        className="flex-1 flex overflow-x-auto gap-4 p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-700"
                                        style={{ overflowAnchor: 'none' }}
                                   >
                                        {filteredColumns.map((col, idx) => (
                                             <Draggable key={col.id} draggableId={col.id} index={idx}>
                                                  {(prov) => (
                                                       <div ref={prov.innerRef} {...prov.draggableProps} style={prov.draggableProps.style} className="flex-shrink-0 w-[88vw] sm:w-80 lg:w-96">
                                                            <Column
                                                                 column={col}
                                                                 colIndex={idx}
                                                                 onUpdateColumnTitle={handleUpdateColumnTitle}
                                                                 onRemoveColumn={handleRemoveColumn}
                                                                 onTaskAdded={onTaskAdded}
                                                                 onRemoveTask={onTaskRemoved}
                                                                 onOpenTaskDetail={handleOpenTaskDetail}
                                                                 selectedTaskId={selectedTaskId}
                                                                 currentUser={currentUser}
                                                                 onOpenAddTask={openAddTask}
                                                                 priorities={priorities}
                                                                 dragHandleProps={prov.dragHandleProps ?? undefined}
                                                                 onRegisterScrollRef={registerColumnScrollRef}
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
                         <ListView columns={filteredColumns} onOpenTaskDetail={handleOpenTaskDetail} onRemoveTask={onTaskRemoved} priorities={priorities} />
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
                         onClose={handleCloseTaskView}
                         onTaskUpdate={handleCloseTaskView}
                         onTaskAdded={handleCloseTaskView}
                         currentUser={currentUser!}
                         statuses={statuses}
                    />
               )}
          </div>
     );
}

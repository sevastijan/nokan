'use client';

import dynamic from 'next/dynamic';

import { useEffect, useState, useCallback, useRef, useLayoutEffect, Suspense, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getSupabase } from '@/app/lib/supabase';
import { useBoard } from '@/app/hooks/useBoard';
import Column from '@/app/components/Column';
import Loader from '@/app/components/Loader';
import { getPriorities } from '@/app/lib/api';
import { Column as ColumnType, User, Priority, AssigneeOption, TaskTypeFilter } from '@/app/types/globalTypes';
import BoardHeader from '@/app/components/Board/BoardHeader';
import { getSubtaskPreference } from '@/app/hooks/useSubtaskPreference';
import TaskViewSkeleton from '@/app/components/SingleTaskView/TaskViewSkeleton';
import { useUpdateTaskMutation } from '@/app/store/apiSlice';
import { FiX } from 'react-icons/fi';
import SingleTaskView from '@/app/components/SingleTaskView/SingleTaskView';

const ListView = dynamic(() => import('@/app/components/ListView/ListView'), {
     loading: () => (
          <div className="w-full max-w-5xl mx-auto animate-pulse">
               <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="col-span-2 h-4 bg-slate-700/30 rounded" />
                    ))}
               </div>
               <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                         <div key={i} className="px-5 py-4 border-b border-slate-700/30 last:border-b-0">
                              <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-slate-700/50" />
                                   <div className="h-5 bg-slate-700/30 rounded flex-1 max-w-xs" />
                              </div>
                         </div>
                    ))}
               </div>
          </div>
     ),
});

const AddColumnPopup = dynamic(() => import('@/app/components/TaskColumn/AddColumnPopup'), {
     loading: () => <div className="text-slate-400">Ładowanie...</div>,
});

const BoardNotesModal = dynamic(() => import('@/app/components/Board/BoardNotesModal'), {
     loading: () => <div className="text-slate-400">Ładowanie notatek...</div>,
     ssr: false,
});

const ApiTokensModal = dynamic(() => import('@/app/components/Board/ApiTokensModal'), {
     loading: () => <div className="text-slate-400">Ładowanie...</div>,
     ssr: false,
});

const TaskCompletionModal = dynamic(() => import('@/app/components/TaskCompletionModal/TaskCompletionModal'), {
     ssr: false,
});

export default function Page() {
     const params = useParams();
     const router = useRouter();
     const searchParams = useSearchParams();
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
     const [filterType, setFilterType] = useState<TaskTypeFilter>('all');
     const [showSubtasks, setShowSubtasks] = useState(false);
     const [notesOpen, setNotesOpen] = useState(false);
     const [apiTokensOpen, setApiTokensOpen] = useState(false);
     const [completionModalOpen, setCompletionModalOpen] = useState(false);
     const [pendingCompletionTask, setPendingCompletionTask] = useState<{ taskId: string; title: string } | null>(null);

     const prevBoardIdRef = useRef<string | null>(null);
     const columnsContainerRef = useRef<HTMLDivElement>(null);
     const savedScrollPosition = useRef<{ x: number; y: number } | null>(null);
     const columnScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
     const savedColumnScrollPositions = useRef<Map<string, number>>(new Map());

     const [updateTask] = useUpdateTaskMutation();

     const handleOpenNotes = () => setNotesOpen(true);
     const handleCloseNotes = () => setNotesOpen(false);
     const handleOpenApiTokens = () => setApiTokensOpen(true);
     const handleCloseApiTokens = () => setApiTokensOpen(false);

     useEffect(() => {
          const assigneeFromUrl = searchParams.get('assignee');
          if (assigneeFromUrl) {
               setFilterAssignee(assigneeFromUrl);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

     const handleFilterByAssignee = useCallback(
          (assigneeId: string) => {
               const params = new URLSearchParams(searchParams.toString());

               if (filterAssignee === assigneeId) {
                    setFilterAssignee(null);
                    params.delete('assignee');
                    toast.info('Filtr usunięty');
               } else {
                    setFilterAssignee(assigneeId);
                    params.set('assignee', assigneeId);
                    toast.success(`Filtrowanie tasków`, {
                         icon: '👤',
                         duration: 2000,
                    });
               }

               const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
               router.replace(newUrl, { scroll: false });

               if (columnsContainerRef.current) {
                    columnsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
               }
          },
          [filterAssignee, searchParams, router],
     );

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
                         { id: 'medium', label: 'Średni', color: '#eab308' },
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
                         custom_name: data.custom_name || undefined,
                         custom_image: data.custom_image || undefined,
                         created_at: data.created_at!,
                    });
               } else {
                    const { data: newUser } = await getSupabase().from('users').insert({ email: session.user.email, name: session.user.name, image: session.user.image }).select().single();
                    setCurrentUser({
                         id: newUser.id,
                         name: newUser.name!,
                         email: newUser.email,
                         image: newUser.image || undefined,
                         custom_name: newUser.custom_name || undefined,
                         custom_image: newUser.custom_image || undefined,
                         created_at: newUser.created_at!,
                    });
               }
          })();
     }, [session?.user?.email, session?.user?.name, session?.user?.image]);

     useEffect(() => {
          if (currentUser?.id) {
               setShowSubtasks(getSubtaskPreference(currentUser.id));
          }
     }, [currentUser?.id]);

     useEffect(() => {
          if (status === 'unauthenticated') router.push('/auth/signin');
     }, [status, router]);

     useEffect(() => {
          if (typeof window === 'undefined') return;

          const taskIdFromUrl = searchParams.get('task');
          if (taskIdFromUrl) {
               setSelectedTaskId(taskIdFromUrl);
          }
     }, [searchParams]);

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
     }, [localColumns]);

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
                         // Block story with incomplete subtasks from Done column BEFORE moving
                         const isDoneColumn = dstCol.title?.toLowerCase() === 'done';
                         const isTaskNotCompleted = !movedTask.completed;

                         if (isDoneColumn && isTaskNotCompleted && movedTask.type === 'story') {
                              const { data: storySubtasks } = await getSupabase().from('tasks').select('id, completed').eq('parent_id', movedTask.id);
                              const incompleteCount = storySubtasks?.filter((s) => !s.completed).length || 0;
                              if (incompleteCount > 0) {
                                   toast.warning(`Nie można zakończyć Story — ${incompleteCount} subtask${incompleteCount === 1 ? '' : 'ów'} nie jest ukończonych`, {
                                        description: 'Ukończ wszystkie subtaski przed przeniesieniem Story do Done.',
                                   });
                                   return;
                              }
                         }

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

                              // Sync status with column — find status matching destination column name
                              const matchingStatus = statuses.find((s) => s.label.toLowerCase() === dstCol.title?.toLowerCase());
                              if (matchingStatus) {
                                   await getSupabase().from('tasks').update({ status_id: matchingStatus.id }).eq('id', movedTask.id);
                              }

                              if (isDoneColumn && isTaskNotCompleted) {
                                   setPendingCompletionTask({
                                        taskId: movedTask.id,
                                        title: movedTask.title || 'Zadanie bez tytułu',
                                   });
                                   setCompletionModalOpen(true);
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

     const handleConfirmCompletion = async () => {
          if (!pendingCompletionTask) return;

          try {
               await updateTask({
                    taskId: pendingCompletionTask.taskId,
                    data: { completed: true },
               }).unwrap();

               toast.success('Zadanie oznaczone jako zakończone');
               await fetchBoardData();
          } catch (error) {
               console.error('Failed to mark task as completed:', error);
               toast.error('Nie udało się oznaczyć zadania jako zakończone');
          } finally {
               setCompletionModalOpen(false);
               setPendingCompletionTask(null);
          }
     };

     const handleCancelCompletion = useCallback(() => {
          setCompletionModalOpen(false);
          setPendingCompletionTask(null);
     }, []);

     const onBoardTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
          setBoardTitle(e.target.value);
     }, []);

     const onBoardTitleBlur = useCallback(() => {
          const trimmed = boardTitle.trim();
          if (trimmed && trimmed !== board?.title) handleUpdateBoardTitle(trimmed);
     }, [boardTitle, board?.title, handleUpdateBoardTitle]);

     const openAddColumn = useCallback(() => setIsPopupOpen(true), []);
     const closeAddColumn = useCallback(() => setIsPopupOpen(false), []);

     const onAddColumn = useCallback(async () => {
          if (!newColumnTitle.trim()) return;
          setIsAddingColumn(true);
          await handleAddColumn(newColumnTitle.trim());
          setNewColumnTitle('');
          setIsPopupOpen(false);
          await fetchBoardData();
          setIsAddingColumn(false);
     }, [newColumnTitle, handleAddColumn, fetchBoardData]);

     const openAddTask = useCallback(
          (colId: string) => {
               saveScrollPosition();
               setAddTaskColumnId(colId);
          },
          [saveScrollPosition],
     );

     const onTaskAdded = useCallback(
          async (columnId: string, title: string, priority?: string, userId?: string) => {
               const task = await handleAddTask(columnId, title, priority, userId);
               setLocalColumns((cols) => cols.map((c) => (c.id === columnId ? { ...c, tasks: [...(c.tasks || []), task] } : c)));
               setAddTaskColumnId(null);
               return task;
          },
          [handleAddTask],
     );

     const onTaskRemoved = useCallback(
          async (columnId: string, taskId: string) => {
               await handleRemoveTask(columnId, taskId);
               setLocalColumns((cols) => cols.map((c) => (c.id === columnId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c)));
          },
          [handleRemoveTask],
     );

     const assigneesList = useMemo<AssigneeOption[]>(() => {
          if (!board) return [];
          const list: AssigneeOption[] = [];
          const seenIds = new Set<string>();

          board.columns.forEach((col) => {
               (col.tasks || []).forEach((task) => {
                    (task.collaborators || []).forEach((collab) => {
                         if (collab.id && !seenIds.has(collab.id)) {
                              seenIds.add(collab.id);
                              list.push({
                                   id: collab.id,
                                   name: collab.custom_name || collab.name || collab.email || 'User',
                                   image: collab.custom_image || collab.image || undefined,
                              });
                         }
                    });
               });
          });

          return list;
     }, [board]);

     const filteredColumns = useMemo(() => {
          return localColumns.map((col) => {
               const filteredTasks = (col.tasks || []).filter((task) => {
                    // Hide subtasks unless the user toggled them visible
                    if (task.parent_id && !showSubtasks) return false;

                    if (searchTerm) {
                         const term = searchTerm.toLowerCase();
                         if (!task.title?.toLowerCase().includes(term) && !task.description?.toLowerCase().includes(term)) return false;
                    }
                    if (filterPriority && task.priority !== filterPriority) return false;
                    if (filterAssignee) {
                         const hasAssignee = (task.collaborators || []).some((c) => c.id === filterAssignee);
                         if (!hasAssignee) return false;
                    }
                    if (filterType !== 'all') {
                         const taskType = task.type || 'task';
                         if (taskType !== filterType) return false;
                    }
                    return true;
               });
               return { ...col, tasks: filteredTasks };
          });
     }, [localColumns, searchTerm, filterPriority, filterAssignee, filterType, showSubtasks]);

     const currentColumnId = useMemo(() => {
          if (addTaskColumnId) return addTaskColumnId;
          if (selectedTaskId) {
               return localColumns.find((c) => c.tasks.some((t) => t.id === selectedTaskId))?.id ?? null;
          }
          return null;
     }, [addTaskColumnId, selectedTaskId, localColumns]);

     const handleOpenTaskDetail = useCallback(
          (taskId: string) => {
               saveScrollPosition();
               setSelectedTaskId(taskId);

               const params = new URLSearchParams(searchParams.toString());
               params.set('task', taskId);
               router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
          },
          [saveScrollPosition, searchParams, router],
     );

     const handleCloseTaskView = useCallback(() => {
          saveScrollPosition();
          setSelectedTaskId(null);
          setAddTaskColumnId(null);

          const params = new URLSearchParams(searchParams.toString());
          if (params.has('task')) {
               params.delete('task');
               const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
               router.replace(newUrl, { scroll: false });
          }

          fetchBoardData();
     }, [saveScrollPosition, searchParams, router, fetchBoardData]);

     const activeFilteredAssignee = useMemo(() => {
          return assigneesList.find((a) => a.id === filterAssignee);
     }, [assigneesList, filterAssignee]);

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
                    filterType={filterType}
                    onFilterTypeChange={setFilterType}
                    boardId={boardId}
                    currentUserId={currentUser?.id}
                    onOpenNotes={handleOpenNotes}
                    onOpenApiTokens={handleOpenApiTokens}
                    showSubtasks={showSubtasks}
                    onShowSubtasksChange={setShowSubtasks}
               />
               {filterAssignee && activeFilteredAssignee && (
                    <div className="px-4 md:px-6 pt-4">
                         <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                              <span className="text-sm text-slate-400">
                                   Filtr: <span className="text-slate-200">{activeFilteredAssignee.name}</span>
                              </span>
                              <button onClick={() => handleFilterByAssignee(filterAssignee)} className="p-1 hover:bg-slate-700 rounded transition-colors" aria-label="Usuń filtr">
                                   <FiX size={14} className="text-slate-400 hover:text-slate-200" />
                              </button>
                         </div>
                    </div>
               )}
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
                                                       <div ref={prov.innerRef} {...prov.draggableProps} style={prov.draggableProps.style} className="shrink-0 w-[88vw] sm:w-80 lg:w-96">
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
                                                                 onFilterByAssignee={handleFilterByAssignee}
                                                                 activeFilterAssigneeId={filterAssignee}
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
               {(selectedTaskId || addTaskColumnId) && currentColumnId && currentUser && (
                    <Suspense
                         fallback={
                              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
                                   <Loader text="Ładowanie zadania..." />
                              </div>
                         }
                    >
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
                              currentUser={currentUser}
                              statuses={statuses}
                              onOpenTask={(taskId) => setSelectedTaskId(taskId)}
                         />
                    </Suspense>
               )}
               <TaskCompletionModal isOpen={completionModalOpen} onClose={handleCancelCompletion} onConfirm={handleConfirmCompletion} taskTitle={pendingCompletionTask?.title || ''} />
               <BoardNotesModal isOpen={notesOpen} onClose={handleCloseNotes} boardId={boardId} />
               <ApiTokensModal isOpen={apiTokensOpen} onClose={handleCloseApiTokens} boardId={boardId} />
          </div>
     );
}

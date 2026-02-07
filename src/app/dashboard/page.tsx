'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
     useGetCurrentUserQuery,
     useGetMyBoardsQuery,
     useGetClientBoardsWithDetailsQuery,
     useAddBoardMutation,
     useUpdateBoardTitleMutation,
     useRemoveBoardMutation,
     useCreateBoardFromTemplateMutation,
     useGetUserTasksQuery,
     useUpdateTaskCompletionMutation,
} from '@/app/store/apiSlice';
import Loader from '@/app/components/Loader';
import BoardModal from '@/app/components/Board/BoardModal';
import { BoardTemplate } from '@/app/types/globalTypes';
import { DashboardToolbar } from '@/app/components/Dashboard/DashboardToolbar';
import { BoardListItem } from '@/app/components/Dashboard/BoardListItem';
import { DashboardStats } from '@/app/components/Dashboard/DashboardStats';
import { DashboardTabs, DashboardTab } from '@/app/components/Dashboard/DashboardTabs';
import { UserTaskList } from '@/app/components/Dashboard/UserTaskList';
import { Layers, ArrowRight, Sparkles } from 'lucide-react';

function getTaskLabel(count: number) {
     if (count === 1) return 'zadanie';
     if (count >= 2 && count <= 4) return 'zadania';
     return 'zadań';
}

const tabContentVariants = {
     enter: { opacity: 0, y: 8 },
     center: { opacity: 1, y: 0 },
     exit: { opacity: 0, y: -8 },
};

export default function DashboardPage() {
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();

     const { data: currentUser, isFetching: loadingUser } = useGetCurrentUserQuery(session!, {
          skip: authStatus !== 'authenticated',
     });

     const {
          data: myBoards = [],
          isFetching: loadingMyBoards,
          refetch: refetchBoards,
     } = useGetMyBoardsQuery(currentUser?.id || '', {
          skip: !currentUser?.id,
     });

     const userRole = currentUser?.role ?? null;
     const isClient = userRole === 'CLIENT';

     const { data: assignedBoards = [], isFetching: loadingAssignedBoards } = useGetClientBoardsWithDetailsQuery(currentUser?.id ?? '', {
          skip: !currentUser?.id || !isClient,
     });

     const { data: userTasks = [], isFetching: loadingUserTasks } = useGetUserTasksQuery(currentUser?.id || '', {
          skip: !currentUser?.id,
     });

     const [updateTaskCompletion] = useUpdateTaskCompletionMutation();
     const [addBoard] = useAddBoardMutation();
     const [updateBoardTitle] = useUpdateBoardTitleMutation();
     const [removeBoard] = useRemoveBoardMutation();
     const [createBoardFromTemplate] = useCreateBoardFromTemplateMutation();

     const [activeTab, setActiveTab] = useState<DashboardTab>('boards');
     const [modalOpen, setModalOpen] = useState(false);
     const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');
     const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
     const [modalTitle, setModalTitle] = useState('');
     const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
     const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
     const [searchTerm, setSearchTerm] = useState('');
     const [hasTasksOnly, setHasTasksOnly] = useState(false);
     const [hasMembersOnly, setHasMembersOnly] = useState(false);

     useEffect(() => {
          if (authStatus === 'unauthenticated') {
               router.push('/api/auth/signin');
          }
     }, [authStatus, router]);

     const boardStats = useMemo(
          () => ({
               totalBoards: myBoards.length,
               totalTasks: myBoards.reduce((sum, board) => sum + (board._count?.tasks ?? 0), 0),
               totalMembers: myBoards.reduce((sum, board) => sum + (board._count?.teamMembers ?? 0), 0),
          }),
          [myBoards],
     );

     const taskStats = useMemo(() => {
          const active = userTasks.filter((t) => !t.completed).length;
          const completed = userTasks.filter((t) => t.completed).length;
          const overdue = userTasks.filter((t) => t.due_date && !t.completed && new Date(t.due_date) < new Date()).length;
          return { active, completed, overdue };
     }, [userTasks]);

     const openCreate = useCallback(() => {
          setModalMode('create');
          setSelectedBoard(null);
          setModalTitle('');
          setSelectedTemplate(null);
          setTemplateRefreshTrigger((prev) => prev + 1);
          setModalOpen(true);
     }, []);

     const openEdit = useCallback((boardId: string, boardTitle: string) => {
          setModalMode('edit');
          setSelectedBoard(boardId);
          setModalTitle(boardTitle);
          setModalOpen(true);
     }, []);

     const openDelete = useCallback((boardId: string) => {
          setModalMode('delete');
          setSelectedBoard(boardId);
          setModalOpen(true);
     }, []);

     const handleSave = useCallback(
          async (title: string, templateId?: string | null, memberIds?: string[]) => {
               if (!currentUser) return;

               try {
                    if (modalMode === 'create') {
                         if (templateId) {
                              await createBoardFromTemplate({
                                   title,
                                   templateId,
                                   user_id: currentUser.id,
                                   memberIds,
                              }).unwrap();
                         } else {
                              await addBoard({
                                   title,
                                   user_id: currentUser.id,
                                   memberIds,
                              }).unwrap();
                         }
                    } else if (modalMode === 'edit' && selectedBoard) {
                         await updateBoardTitle({
                              boardId: selectedBoard,
                              title,
                         }).unwrap();
                    }

                    await refetchBoards();
                    setModalOpen(false);
               } catch (error) {
                    console.error('Board operation failed:', error);
                    alert(`Nie udało się ${modalMode === 'create' ? 'utworzyć' : 'zaktualizować'} projektu`);
               }
          },
          [currentUser, modalMode, selectedBoard, createBoardFromTemplate, addBoard, updateBoardTitle, refetchBoards],
     );

     const handleDelete = useCallback(async () => {
          if (!selectedBoard) return;

          try {
               await removeBoard({ boardId: selectedBoard }).unwrap();
               await refetchBoards();
               setModalOpen(false);
          } catch (error) {
               console.error('Delete board failed:', error);
               alert('Nie udało się usunąć projektu');
          }
     }, [selectedBoard, removeBoard, refetchBoards]);

     const handleBoardClick = useCallback(
          (boardId: string) => {
               router.push(`/board/${boardId}`);
          },
          [router],
     );

     const handleToggleTaskComplete = useCallback(
          async (taskId: string, completed: boolean) => {
               try {
                    await updateTaskCompletion({ taskId, completed }).unwrap();
               } catch (error) {
                    console.error('Toggle task completion failed:', error);
               }
          },
          [updateTaskCompletion],
     );

     const filteredBoards = useMemo(() => {
          return myBoards.filter((board) => {
               const matchesSearch = !searchTerm || board.title.toLowerCase().includes(searchTerm.toLowerCase());
               const matchesTasks = !hasTasksOnly || (board._count?.tasks && board._count.tasks > 0);
               const matchesMembers = !hasMembersOnly || (board._count?.teamMembers && board._count.teamMembers > 0);

               return matchesSearch && matchesTasks && matchesMembers;
          });
     }, [myBoards, searchTerm, hasTasksOnly, hasMembersOnly]);

     const handleClearFilters = useCallback(() => {
          setHasTasksOnly(false);
          setHasMembersOnly(false);
          setSearchTerm('');
     }, []);

     const isLoading = authStatus === 'loading' || loadingUser || loadingMyBoards || loadingAssignedBoards;
     const hasAssignedBoards = isClient && assignedBoards.length > 0;
     const hasActiveFilters = searchTerm || hasTasksOnly || hasMembersOnly;

     if (isLoading) {
          return <Loader text="Ładowanie..." />;
     }

     if (authStatus === 'unauthenticated') {
          return null;
     }

     return (
          <>
               <div className="min-h-screen bg-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent pointer-events-none" />

                    <div className="relative">
                         <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                              <div className="max-w-7xl mx-auto flex flex-col gap-6">
                                   {/* Tab bar */}
                                   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <DashboardTabs
                                             activeTab={activeTab}
                                             onTabChange={setActiveTab}
                                             boardsCount={myBoards.length}
                                             tasksCount={userTasks.length}
                                        />
                                   </div>

                                   {/* Board toolbar (only on boards tab) */}
                                   {activeTab === 'boards' && (
                                        <DashboardToolbar
                                             searchTerm={searchTerm}
                                             onSearchChange={setSearchTerm}
                                             hasTasksOnly={hasTasksOnly}
                                             setHasTasksOnly={setHasTasksOnly}
                                             hasMembersOnly={hasMembersOnly}
                                             setHasMembersOnly={setHasMembersOnly}
                                             onClearFilters={handleClearFilters}
                                             onCreateClick={openCreate}
                                        />
                                   )}

                                   {/* Stats */}
                                   <AnimatePresence mode="wait">
                                        {activeTab === 'boards' ? (
                                             <motion.div
                                                  key="board-stats"
                                                  initial={{ opacity: 0 }}
                                                  animate={{ opacity: 1 }}
                                                  exit={{ opacity: 0 }}
                                                  transition={{ duration: 0.15 }}
                                             >
                                                  <DashboardStats
                                                       totalBoards={boardStats.totalBoards}
                                                       totalTasks={boardStats.totalTasks}
                                                       totalMembers={boardStats.totalMembers}
                                                  />
                                             </motion.div>
                                        ) : (
                                             <motion.div
                                                  key="task-stats"
                                                  initial={{ opacity: 0 }}
                                                  animate={{ opacity: 1 }}
                                                  exit={{ opacity: 0 }}
                                                  transition={{ duration: 0.15 }}
                                             >
                                                  <TaskStats
                                                       active={taskStats.active}
                                                       completed={taskStats.completed}
                                                       overdue={taskStats.overdue}
                                                  />
                                             </motion.div>
                                        )}
                                   </AnimatePresence>
                              </div>
                         </section>

                         <section className="px-4 sm:px-6 lg:px-8 pb-12">
                              <div className="max-w-7xl mx-auto">
                                   <AnimatePresence mode="wait">
                                        {activeTab === 'boards' ? (
                                             <motion.div
                                                  key="boards-content"
                                                  variants={tabContentVariants}
                                                  initial="enter"
                                                  animate="center"
                                                  exit="exit"
                                                  transition={{ duration: 0.2 }}
                                             >
                                                  {filteredBoards.length > 0 ? (
                                                       <div className="flex flex-col gap-3">
                                                            {filteredBoards.map((board) => (
                                                                 <BoardListItem
                                                                      key={board.id}
                                                                      board={board}
                                                                      onEdit={() => openEdit(board.id, board.title)}
                                                                      onDelete={() => openDelete(board.id)}
                                                                      onBoardClick={() => handleBoardClick(board.id)}
                                                                 />
                                                            ))}
                                                       </div>
                                                  ) : (
                                                       <div className="flex flex-col items-center justify-center py-20 px-4">
                                                            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
                                                                 <Layers className="w-10 h-10 text-slate-400" />
                                                            </div>
                                                            <h3 className="text-2xl font-semibold text-white mb-2">{hasActiveFilters ? 'Nie znaleziono projektów' : 'Brak projektów'}</h3>
                                                            <p className="text-slate-400 text-center max-w-md mb-6">
                                                                 {hasActiveFilters ? 'Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry' : 'Rozpocznij swoją przygodę tworząc pierwszy projekt'}
                                                            </p>
                                                            {hasActiveFilters ? (
                                                                 <button
                                                                      onClick={handleClearFilters}
                                                                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-200 border border-slate-700 hover:border-slate-600 cursor-pointer"
                                                                      aria-label="Wyczyść wszystkie filtry"
                                                                 >
                                                                      Wyczyść filtry
                                                                 </button>
                                                            ) : (
                                                                 <button
                                                                      onClick={openCreate}
                                                                      className="group px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
                                                                      aria-label="Utwórz nowy projekt"
                                                                 >
                                                                      <Sparkles className="w-5 h-5" />
                                                                      Utwórz pierwszy projekt
                                                                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                                 </button>
                                                            )}
                                                       </div>
                                                  )}
                                             </motion.div>
                                        ) : (
                                             <motion.div
                                                  key="tasks-content"
                                                  variants={tabContentVariants}
                                                  initial="enter"
                                                  animate="center"
                                                  exit="exit"
                                                  transition={{ duration: 0.2 }}
                                             >
                                                  <UserTaskList
                                                       tasks={userTasks}
                                                       isLoading={loadingUserTasks}
                                                       onToggleComplete={handleToggleTaskComplete}
                                                  />
                                             </motion.div>
                                        )}
                                   </AnimatePresence>
                              </div>
                         </section>

                         {hasAssignedBoards && (
                              <section className="px-4 sm:px-6 lg:px-8 pb-20 border-t border-slate-800/50 pt-12">
                                   <div className="max-w-7xl mx-auto">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                             <div>
                                                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                                       <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                                       Projekty przypisane
                                                  </h2>
                                                  <p className="text-slate-400 text-sm">Projekty udostępnione Ci przez administratora</p>
                                             </div>
                                             <button
                                                  onClick={() => router.push('/submissions')}
                                                  className="group px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50 backdrop-blur-sm flex items-center gap-2 cursor-pointer w-fit"
                                                  aria-label="Sprawdź wszystkie zgłoszenia"
                                             >
                                                  Sprawdź zgłoszenia
                                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                             </button>
                                        </div>

                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                             {assignedBoards.map((board) => {
                                                  const taskCount = board._count.tasks;
                                                  const taskLabel = getTaskLabel(taskCount);

                                                  return (
                                                       <div
                                                            key={board.id}
                                                            className="group relative bg-slate-800/60 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-lg overflow-hidden"
                                                       >
                                                            <div className="absolute inset-0 bg-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                            <div className="relative">
                                                                 <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 min-h-[3.5rem]">{board.title}</h3>
                                                                 <p className="text-sm text-slate-400 mb-5">
                                                                      {taskCount} {taskLabel}
                                                                 </p>
                                                                 <button
                                                                      onClick={() => router.push(`/submit?boardId=${board.id}`)}
                                                                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer group/button"
                                                                      aria-label={`Dodaj zgłoszenie do projektu ${board.title}`}
                                                                 >
                                                                      Dodaj zgłoszenie
                                                                      <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  );
                                             })}
                                        </div>
                                   </div>
                              </section>
                         )}
                    </div>
               </div>

               <BoardModal
                    isOpen={modalOpen}
                    mode={modalMode}
                    initialTitle={modalMode === 'edit' ? modalTitle : ''}
                    boardId={modalMode !== 'create' ? selectedBoard! : undefined}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    onDelete={modalMode === 'delete' ? handleDelete : undefined}
                    selectedTemplate={modalMode === 'create' ? selectedTemplate! : undefined}
                    onTemplateSelect={modalMode === 'create' ? setSelectedTemplate : undefined}
                    templateRefreshTrigger={templateRefreshTrigger}
                    currentUserId={currentUser?.id}
               />
          </>
     );
}

/* Task-specific stats shown on the tasks tab */
function TaskStats({ active, completed, overdue }: { active: number; completed: number; overdue: number }) {
     return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
               <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/15">
                         <svg className="w-4.5 h-4.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                              <path d="m9 12 2 2 4-4" />
                         </svg>
                    </div>
                    <div>
                         <p className="text-xs text-slate-400">Aktywne</p>
                         <p className="text-lg font-semibold text-white leading-tight">{active}</p>
                    </div>
               </div>

               <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/15">
                         <svg className="w-4.5 h-4.5 text-violet-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                         </svg>
                    </div>
                    <div>
                         <p className="text-xs text-slate-400">Ukończone</p>
                         <p className="text-lg font-semibold text-white leading-tight">{completed}</p>
                    </div>
               </div>

               <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/15">
                         <svg className="w-4.5 h-4.5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                         </svg>
                    </div>
                    <div>
                         <p className="text-xs text-slate-400">Po terminie</p>
                         <p className="text-lg font-semibold text-white leading-tight">{overdue}</p>
                    </div>
               </div>
          </div>
     );
}

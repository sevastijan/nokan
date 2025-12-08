'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
     useGetCurrentUserQuery,
     useGetMyBoardsQuery,
     useGetClientBoardsWithDetailsQuery,
     useAddBoardMutation,
     useUpdateBoardTitleMutation,
     useRemoveBoardMutation,
     useCreateBoardFromTemplateMutation,
} from '@/app/store/apiSlice';
import { supabase } from '@/app/lib/supabase';
import Loader from '@/app/components/Loader';
import BoardModal from '@/app/components/Board/BoardModal';
import { BoardTemplate } from '@/app/types/globalTypes';
import { DashboardToolbar } from '@/app/components/Dashboard/DashboardToolbar';
import { BoardListItem } from '@/app/components/Dashboard/BoardListItem';
import { DashboardStats } from '@/app/components/Dashboard/DashboardStats';
import { Layers, ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();

     const [clientUuid, setClientUuid] = useState<string | null>(null);
     const [userRole, setUserRole] = useState<string | null>(null);
     const [fetchingUserData, setFetchingUserData] = useState(true);

     useEffect(() => {
          if (authStatus === 'authenticated' && session?.user?.email) {
               const fetchUserData = async () => {
                    try {
                         const { data } = await supabase.from('users').select('id, role').eq('email', session.user.email).single();

                         if (data) {
                              setClientUuid(data.id);
                              setUserRole(data.role);
                         }
                    } catch (error) {
                         console.error('Error fetching user data:', error);
                    } finally {
                         setFetchingUserData(false);
                    }
               };

               fetchUserData();
          } else if (authStatus === 'unauthenticated') {
               setFetchingUserData(false);
          }
     }, [session?.user?.email, authStatus]);

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

     const { data: assignedBoards = [], isFetching: loadingAssignedBoards } = useGetClientBoardsWithDetailsQuery(clientUuid ?? '', {
          skip: !clientUuid || userRole !== 'CLIENT',
     });

     const [addBoard] = useAddBoardMutation();
     const [updateBoardTitle] = useUpdateBoardTitleMutation();
     const [removeBoard] = useRemoveBoardMutation();
     const [createBoardFromTemplate] = useCreateBoardFromTemplateMutation();

     const [modalOpen, setModalOpen] = useState(false);
     const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');
     const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
     const [modalTitle, setModalTitle] = useState('');
     const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
     const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState(0);
     const [searchTerm, setSearchTerm] = useState('');
     const [hasTasksOnly, setHasTasksOnly] = useState(false);
     const [hasMembersOnly, setHasMembersOnly] = useState(false);
     const [openMenuId, setOpenMenuId] = useState<string | null>(null);

     useEffect(() => {
          if (authStatus === 'unauthenticated') {
               router.push('/api/auth/signin');
          }
     }, [authStatus, router]);

     const boardsToDisplay = myBoards;

     const stats = useMemo(
          () => ({
               totalBoards: boardsToDisplay.length,
               totalTasks: boardsToDisplay.reduce((sum, board) => sum + (board._count?.tasks ?? 0), 0),
               totalMembers: boardsToDisplay.reduce((sum, board) => sum + (board._count?.teamMembers ?? 0), 0),
          }),
          [boardsToDisplay],
     );

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
          setOpenMenuId(null);
     }, []);

     const openDelete = useCallback((boardId: string) => {
          setModalMode('delete');
          setSelectedBoard(boardId);
          setModalOpen(true);
          setOpenMenuId(null);
     }, []);

     const handleSave = useCallback(
          async (title: string, templateId?: string | null) => {
               if (!currentUser) return;

               try {
                    if (modalMode === 'create') {
                         if (templateId) {
                              await createBoardFromTemplate({
                                   title,
                                   templateId,
                                   user_id: currentUser.id,
                              }).unwrap();
                         } else {
                              await addBoard({
                                   title,
                                   user_id: currentUser.id,
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

     const filteredBoards = useMemo(() => {
          return boardsToDisplay.filter((board) => {
               const matchesSearch = !searchTerm || board.title.toLowerCase().includes(searchTerm.toLowerCase());
               const matchesTasks = !hasTasksOnly || (board._count?.tasks && board._count.tasks > 0);
               const matchesMembers = !hasMembersOnly || (board._count?.teamMembers && board._count.teamMembers > 0);

               return matchesSearch && matchesTasks && matchesMembers;
          });
     }, [boardsToDisplay, searchTerm, hasTasksOnly, hasMembersOnly]);

     const handleClearFilters = useCallback(() => {
          setHasTasksOnly(false);
          setHasMembersOnly(false);
          setSearchTerm('');
     }, []);

     const getTaskLabel = useCallback((count: number) => {
          if (count === 1) return 'zadanie';
          if (count >= 2 && count <= 4) return 'zadania';
          return 'zadań';
     }, []);

     const isLoading = authStatus === 'loading' || fetchingUserData || loadingUser || loadingMyBoards || loadingAssignedBoards;
     const isClient = userRole === 'CLIENT';
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
               <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />

                    <div className="relative">
                         <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                              <DashboardToolbar
                                   searchTerm={searchTerm}
                                   onSearchChange={setSearchTerm}
                                   hasTasksOnly={hasTasksOnly}
                                   setHasTasksOnly={setHasTasksOnly}
                                   hasMembersOnly={hasMembersOnly}
                                   setHasMembersOnly={setHasMembersOnly}
                                   onClearFilters={handleClearFilters}
                                   onCalendarClick={() => router.push('/calendar')}
                                   onCreateClick={openCreate}
                              />
                         </section>

                         <section className="px-4 sm:px-6 lg:px-8 pb-12">
                              <div className="max-w-7xl mx-auto">
                                   {filteredBoards.length > 0 ? (
                                        <div className="flex flex-col gap-6">
                                             {filteredBoards.map((board) => (
                                                  <BoardListItem
                                                       key={board.id}
                                                       board={board}
                                                       isMenuOpen={openMenuId === board.id}
                                                       onMenuToggle={() => setOpenMenuId(openMenuId === board.id ? null : board.id)}
                                                       onEdit={(e) => {
                                                            e.stopPropagation();
                                                            openEdit(board.id, board.title);
                                                       }}
                                                       onDelete={(e) => {
                                                            e.stopPropagation();
                                                            openDelete(board.id);
                                                       }}
                                                       onBoardClick={() => handleBoardClick(board.id)}
                                                  />
                                             ))}
                                        </div>
                                   ) : (
                                        <div className="flex flex-col items-center justify-center py-20 px-4">
                                             <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-purple-500/20">
                                                  <Layers className="w-10 h-10 text-purple-400" />
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
                                                       className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer"
                                                       aria-label="Utwórz nowy projekt"
                                                  >
                                                       <Sparkles className="w-5 h-5" />
                                                       Utwórz pierwszy projekt
                                                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                  </button>
                                             )}
                                        </div>
                                   )}
                              </div>
                         </section>

                         <section className="pb-8 px-4 sm:px-6 lg:px-8">
                              <div className="max-w-7xl mx-auto">
                                   <DashboardStats totalBoards={stats.totalBoards} totalTasks={stats.totalTasks} totalMembers={stats.totalMembers} />
                              </div>
                         </section>

                         {hasAssignedBoards && (
                              <section className="px-4 sm:px-6 lg:px-8 pb-20 border-t border-slate-800/50 pt-12">
                                   <div className="max-w-7xl mx-auto">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                             <div>
                                                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                                       <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
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
                                                            className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 overflow-hidden"
                                                       >
                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                            <div className="relative">
                                                                 <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 min-h-[3.5rem]">{board.title}</h3>
                                                                 <p className="text-sm text-slate-400 mb-5">
                                                                      {taskCount} {taskLabel}
                                                                 </p>
                                                                 <button
                                                                      onClick={() => router.push(`/submit?boardId=${board.id}`)}
                                                                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer group/button"
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
               />
          </>
     );
}

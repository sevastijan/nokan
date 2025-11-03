'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGetCurrentUserQuery, useGetMyBoardsQuery, useAddBoardMutation, useUpdateBoardTitleMutation, useRemoveBoardMutation, useCreateBoardFromTemplateMutation } from '@/app/store/apiSlice';
import Loader from '@/app/components/Loader';
import BoardModal from '@/app/components/Board/BoardModal';
import { BoardTemplate } from '@/app/types/globalTypes';
import { DashboardToolbar } from '@/app/components/Dashboard/DashboardToolbar';
import { BoardListItem } from '@/app/components/Dashboard/BoardListItem';
import { DashboardStats } from '@/app/components/Dashboard/DashboardStats';

const DashboardPage = () => {
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();

     // Get current user and boards
     const {
          data: currentUser,
          isFetching: loadingUser,
          error: userError,
     } = useGetCurrentUserQuery(session!, {
          skip: authStatus !== 'authenticated',
     });

     const { data: boards, isFetching: loadingBoards, error: boardsError, refetch: refetchBoards } = useGetMyBoardsQuery(currentUser?.id || '', { skip: !currentUser?.id });

     // Mutations
     const [addBoard] = useAddBoardMutation();
     const [updateBoardTitle] = useUpdateBoardTitleMutation();
     const [removeBoard] = useRemoveBoardMutation();
     const [createBoardFromTemplate] = useCreateBoardFromTemplateMutation();

     // Modal state
     const [modalOpen, setModalOpen] = useState(false);
     const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');
     const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
     const [modalTitle, setModalTitle] = useState<string>('');

     // Template selection
     const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
     const [templateRefreshTrigger, setTemplateRefreshTrigger] = useState<number>(0);

     // Search and filter state
     const [searchTerm, setSearchTerm] = useState<string>('');
     const [hasTasksOnly, setHasTasksOnly] = useState<boolean>(false);
     const [hasMembersOnly, setHasMembersOnly] = useState<boolean>(false);

     // Board actions menu
     const [boardMenuOpen, setBoardMenuOpen] = useState<string | null>(null);

     // Redirect if unauthenticated
     useEffect(() => {
          if (authStatus === 'unauthenticated') router.push('/api/auth/signin');
     }, [authStatus, router]);

     // Stats
     const totalBoards = boards?.length ?? 0;
     const totalTasks = boards?.reduce((sum, b) => sum + (b._count?.tasks ?? 0), 0) ?? 0;
     const totalMembers = boards?.reduce((sum, b) => sum + (b._count?.teamMembers ?? 0), 0) ?? 0;

     // Open/Create/Edit/Delete handlers
     const openCreate = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          setSelectedBoard(null);
          setModalMode('create');
          setModalTitle('');
          setSelectedTemplate(null);
          setTemplateRefreshTrigger((t) => t + 1);
          setModalOpen(true);
     };

     const openEdit = (e: React.MouseEvent, boardId: string) => {
          e.stopPropagation();
          const b = boards?.find((b) => b.id === boardId);
          if (b) {
               setSelectedBoard(boardId);
               setModalMode('edit');
               setModalTitle(b.title);
               setSelectedTemplate(null);
               setModalOpen(true);
          }
          setBoardMenuOpen(null);
     };

     const openDelete = (e: React.MouseEvent, boardId: string) => {
          e.stopPropagation();
          const b = boards?.find((b) => b.id === boardId);
          if (b) {
               setSelectedBoard(boardId);
               setModalMode('delete');
               setModalTitle(b.title);
               setSelectedTemplate(null);
               setModalOpen(true);
          }
          setBoardMenuOpen(null);
     };

     // Save/Create Board
     const handleSave = async (title: string, templateId?: string | null) => {
          if (modalMode === 'create' && currentUser) {
               try {
                    if (templateId) {
                         await createBoardFromTemplate({
                              title,
                              templateId,
                              user_id: currentUser.id,
                         }).unwrap();
                    } else {
                         await addBoard({ title, user_id: currentUser.id }).unwrap();
                    }
                    await refetchBoards();
               } catch {
                    alert('Failed to create board');
               }
          } else if (modalMode === 'edit' && selectedBoard) {
               try {
                    await updateBoardTitle({ boardId: selectedBoard, title }).unwrap();
                    await refetchBoards();
               } catch {
                    alert('Failed to update board title');
               }
          }
          setModalOpen(false);
     };

     // Delete Board
     const handleDelete = async () => {
          if (selectedBoard) {
               try {
                    await removeBoard({ boardId: selectedBoard }).unwrap();
                    await refetchBoards();
               } catch {
                    alert('Failed to delete board');
               }
          }
          setModalOpen(false);
     };

     // Filter + search logic
     const filteredBoards = (boards || []).filter((b) => {
          if (searchTerm.trim() && !b.title.toLowerCase().includes(searchTerm.trim().toLowerCase())) return false;
          if (hasTasksOnly && (!b._count?.tasks || b._count.tasks === 0)) return false;
          if (hasMembersOnly && (!b._count?.teamMembers || b._count.teamMembers === 0)) return false;
          return true;
     });

     if (authStatus === 'loading' || loadingUser || loadingBoards) return <Loader text="Loading dashboard..." />;
     if (authStatus === 'unauthenticated') return null;
     if (userError) return <div className="p-8 text-red-400">Failed to load user data</div>;
     if (boardsError) return <div className="p-8 text-red-400">Failed to load boards</div>;

     return (
          <>
               <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                    {/* Boards & Actions at the Top */}
                    <section className="px-4 sm:px-6 pt-8 pb-6">
                         <DashboardToolbar
                              searchTerm={searchTerm}
                              onSearchChange={setSearchTerm}
                              hasTasksOnly={hasTasksOnly}
                              setHasTasksOnly={setHasTasksOnly}
                              hasMembersOnly={hasMembersOnly}
                              setHasMembersOnly={setHasMembersOnly}
                              onClearFilters={() => {
                                   setHasTasksOnly(false);
                                   setHasMembersOnly(false);
                              }}
                              onCalendarClick={() => router.push('/calendar')}
                              onCreateClick={openCreate}
                         />

                         {/* Board List */}
                         {filteredBoards.length === 0 ? (
                              <p className="text-slate-400 pt-6">No boards found.</p>
                         ) : (
                              <div className="flex flex-col gap-3">
                                   {filteredBoards.map((b) => (
                                        <BoardListItem
                                             key={b.id}
                                             board={b}
                                             isMenuOpen={boardMenuOpen === b.id}
                                             onMenuToggle={() => setBoardMenuOpen(b.id === boardMenuOpen ? null : b.id)}
                                             onEdit={(e) => openEdit(e, b.id)}
                                             onDelete={(e) => openDelete(e, b.id)}
                                             onBoardClick={() => router.push(`/board/${b.id}`)}
                                        />
                                   ))}
                              </div>
                         )}
                    </section>

                    {/* Dashboard Statistics Section */}
                    <DashboardStats totalBoards={totalBoards} totalTasks={totalTasks} totalMembers={totalMembers} />
               </div>

               {/* Board Create/Edit/Delete Modal */}
               <BoardModal
                    isOpen={modalOpen}
                    mode={modalMode}
                    initialTitle={modalMode === 'edit' ? modalTitle : ''}
                    boardId={modalMode === 'edit' || modalMode === 'delete' ? selectedBoard! : undefined}
                    onClose={() => setModalOpen(false)}
                    onSave={async (title: string, tplId?: string | null) => await handleSave(title, tplId)}
                    onDelete={modalMode === 'delete' ? handleDelete : undefined}
                    selectedTemplate={modalMode === 'create' ? selectedTemplate! : undefined}
                    onTemplateSelect={modalMode === 'create' ? (tpl) => setSelectedTemplate(tpl) : undefined}
                    templateRefreshTrigger={templateRefreshTrigger}
               />
          </>
     );
};

export default DashboardPage;

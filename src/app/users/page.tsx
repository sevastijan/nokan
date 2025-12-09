'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
     useGetAllClientsQuery,
     useGetAllBoardsQuery,
     useGetClientBoardAssignmentsQuery,
     useAssignClientToBoardMutation,
     useRemoveClientFromBoardMutation,
     useGetAllUsersQuery,
     useSetUserRoleMutation,
} from '@/app/store/apiSlice';
import { useUserRole } from '@/app/hooks/useUserRole';
import Loader from '@/app/components/Loader';
import { ArrowLeft, X, Users } from 'lucide-react';

export default function UsersManagementPage() {
     const { status: authStatus } = useSession();
     const router = useRouter();
     const { loading: roleLoading, hasManagementAccess } = useUserRole();

     const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
     const [searchTerm, setSearchTerm] = useState('');

     // Queries
     const { data: clientsFromQuery = [] } = useGetAllClientsQuery();
     const { data: allBoards = [] } = useGetAllBoardsQuery();
     const { data: assignments = [], isFetching: loadingAssignments } = useGetClientBoardAssignmentsQuery(selectedClientId || '', {
          skip: !selectedClientId,
     });
     const { data: allUsers = [], isLoading: loadingAllUsers } = useGetAllUsersQuery();

     // Mutations
     const [assign, { isLoading: assigning }] = useAssignClientToBoardMutation();
     const [remove, { isLoading: removing }] = useRemoveClientFromBoardMutation();
     const [setUserRole, { isLoading: changingRole }] = useSetUserRoleMutation();

     const isProcessing = assigning || removing || changingRole;

     // Local state for clients to update immediately after role change
     const [clientsState, setClientsState] = useState(clientsFromQuery);

     // Update clientsState when clientsFromQuery changes
     // (initial fetch or background refetch)
     useMemo(() => setClientsState(clientsFromQuery), [clientsFromQuery]);

     // Filtering
     const filteredClients = useMemo(
          () => clientsState.filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase())),
          [clientsState, searchTerm],
     );

     const filteredUsers = useMemo(
          () => allUsers.filter((u) => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())),
          [allUsers, searchTerm],
     );

     const boardsWithStatus = useMemo(
          () =>
               allBoards.map((board) => {
                    const assignment = assignments.find((a) => a.board_id === board.id);
                    return { ...board, isAssigned: !!assignment, assignmentId: assignment?.id };
               }),
          [allBoards, assignments],
     );

     // Handlers
     const handleAssign = useCallback(
          async (boardId: string) => {
               if (!selectedClientId) return;
               try {
                    await assign({ boardId, clientExternalId: selectedClientId }).unwrap();
               } catch {
                    alert('Nie udało się przypisać boarda');
               }
          },
          [selectedClientId, assign],
     );

     const handleRemove = useCallback(
          async (boardClientId: string) => {
               if (!confirm('Czy na pewno chcesz odebrać klientowi dostęp do tego boarda?')) return;
               try {
                    await remove({ boardClientId }).unwrap();
               } catch {
                    alert('Nie udało się usunąć przypisania');
               }
          },
          [remove],
     );

     const handleRoleChange = useCallback(
          async (userId: string, promote: boolean) => {
               try {
                    await setUserRole({ userId, role: promote ? 'CLIENT' : 'MEMBER' }).unwrap();

                    if (promote) {
                         const newClient = allUsers.find((u) => u.id === userId);
                         if (newClient && !clientsState.some((c) => c.id === userId)) {
                              setClientsState((prev) => [...prev, newClient]);
                         }
                    } else {
                         setClientsState((prev) => prev.filter((c) => c.id !== userId));
                         if (selectedClientId === userId) setSelectedClientId(null);
                    }
               } catch {
                    alert('Nie udało się zmienić roli');
               }
          },
          [setUserRole, clientsState, allUsers, selectedClientId],
     );

     const handleClearSearch = useCallback(() => setSearchTerm(''), []);

     // Auth check
     if (authStatus === 'loading' || roleLoading || loadingAllUsers) return <Loader text="Ładowanie..." />;
     if (authStatus === 'unauthenticated' || !hasManagementAccess()) {
          router.push('/');
          return null;
     }

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <header className="mb-8">
                         <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                              Powrót
                         </button>
                         <h1 className="text-3xl font-bold text-white mb-2">Zarządzanie użytkownikami</h1>
                         <p className="text-slate-400">Przypisuj klientów do boardów oraz nadaj / odbierz rolę CLIENT</p>
                    </header>

                    <div className="relative mb-8">
                         <input
                              type="text"
                              placeholder="Szukaj po nazwie lub emailu..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-4 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                         />
                         {searchTerm && (
                              <button onClick={handleClearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                   <X className="w-5 h-5" />
                              </button>
                         )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <aside className="lg:col-span-1">
                              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 sticky top-4 max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                                   <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                                        <Users className="w-5 h-5" />
                                        Klienci
                                   </h2>
                                   {filteredClients.length === 0 ? (
                                        <p className="text-slate-400">Brak klientów</p>
                                   ) : (
                                        filteredClients.map((client) => (
                                             <button
                                                  key={client.id}
                                                  onClick={() => setSelectedClientId(client.id)}
                                                  className={`w-full text-left p-4 rounded-xl mb-2 flex items-center gap-3 border transition-all ${
                                                       selectedClientId === client.id
                                                            ? 'bg-purple-600 text-white border-purple-500'
                                                            : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/70 hover:border-purple-500/50 text-slate-200'
                                                  }`}
                                             >
                                                  <div className="min-w-0">
                                                       <p className="font-medium truncate">{client.name || 'Bez nazwy'}</p>
                                                       <p className="text-sm opacity-75 truncate">{client.email}</p>
                                                  </div>
                                             </button>
                                        ))
                                   )}
                              </div>
                         </aside>

                         <main className="lg:col-span-2">
                              {selectedClientId ? (
                                   <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                        <h2 className="text-xl font-semibold text-white mb-4">Boardy klienta</h2>
                                        {loadingAssignments ? (
                                             <Loader text="Ładowanie boardów..." />
                                        ) : boardsWithStatus.length === 0 ? (
                                             <p className="text-slate-400">Brak boardów w systemie</p>
                                        ) : (
                                             <div className="space-y-3">
                                                  {boardsWithStatus.map((board) => (
                                                       <div
                                                            key={board.id}
                                                            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                                                       >
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                 <h3 className="font-semibold text-white truncate">{board.title}</h3>
                                                                 <p className="text-sm text-slate-400">
                                                                      {board._count?.tasks || 0} zadań • {board._count?.teamMembers || 0} członków
                                                                 </p>
                                                            </div>
                                                            {board.isAssigned ? (
                                                                 <button
                                                                      onClick={() => handleRemove(board.assignmentId!)}
                                                                      disabled={isProcessing}
                                                                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                                 >
                                                                      Odepnij
                                                                 </button>
                                                            ) : (
                                                                 <button
                                                                      onClick={() => handleAssign(board.id)}
                                                                      disabled={isProcessing}
                                                                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                                 >
                                                                      Przypisz
                                                                 </button>
                                                            )}
                                                       </div>
                                                  ))}
                                             </div>
                                        )}
                                   </div>
                              ) : (
                                   <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-20 text-center">
                                        <p className="text-slate-400">Wybierz klienta aby przypisać mu odpowiedni board.</p>
                                   </div>
                              )}

                              <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-5 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                                   <h2 className="text-lg font-semibold text-white mb-4">Wszyscy użytkownicy</h2>
                                   {filteredUsers.length === 0 ? (
                                        <p className="text-slate-400">Brak użytkowników</p>
                                   ) : (
                                        filteredUsers.map((user) => (
                                             <div
                                                  key={user.id}
                                                  className="flex items-center justify-between p-3 mb-2 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                                             >
                                                  <div>
                                                       <p className="font-medium text-white">{user.name || 'Bez nazwy'}</p>
                                                       <p className="text-sm text-slate-400">{user.email}</p>
                                                       <p className="text-xs text-slate-400">Rola: {user.role || 'Brak'}</p>
                                                  </div>
                                                  {user.role === 'CLIENT' ? (
                                                       <button
                                                            onClick={() => handleRoleChange(user.id, false)}
                                                            disabled={isProcessing}
                                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                       >
                                                            Odejmij CLIENT
                                                       </button>
                                                  ) : (
                                                       <button
                                                            onClick={() => handleRoleChange(user.id, true)}
                                                            disabled={isProcessing}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                       >
                                                            Nadaj CLIENT
                                                       </button>
                                                  )}
                                             </div>
                                        ))
                                   )}
                              </div>
                         </main>
                    </div>
               </div>
          </div>
     );
}

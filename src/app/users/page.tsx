'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGetAllClientsQuery, useGetAllBoardsQuery, useAssignClientToBoardMutation, useRemoveClientFromBoardMutation, useGetClientBoardAssignmentsQuery } from '@/app/store/apiSlice';
import { useUserRole } from '@/app/hooks/useUserRole';
import Loader from '@/app/components/Loader';
import { Search, X, Plus, ArrowLeft, Users } from 'lucide-react';

export default function UsersManagementPage() {
     const { status: authStatus } = useSession();
     const router = useRouter();
     const { loading: roleLoading, hasManagementAccess } = useUserRole();

     const [selectedClient, setSelectedClient] = useState<string | null>(null);
     const [searchTerm, setSearchTerm] = useState('');

     const { data: clients = [], isLoading: loadingClients } = useGetAllClientsQuery();
     const { data: allBoards = [], isLoading: loadingBoards } = useGetAllBoardsQuery();
     const { data: assignments = [], isFetching: loadingAssignments } = useGetClientBoardAssignmentsQuery(selectedClient || '', {
          skip: !selectedClient,
     });

     const [assign, { isLoading: assigning }] = useAssignClientToBoardMutation();
     const [remove, { isLoading: removing }] = useRemoveClientFromBoardMutation();

     const filteredClients = useMemo(() => {
          const term = searchTerm.toLowerCase().trim();
          if (!term) return clients;

          return clients.filter((client) => client.name?.toLowerCase().includes(term) || client.email?.toLowerCase().includes(term));
     }, [clients, searchTerm]);

     const selectedClientData = useMemo(() => clients.find((c) => c.id === selectedClient), [clients, selectedClient]);

     const boardsWithStatus = useMemo(
          () =>
               allBoards.map((board) => {
                    const assignment = assignments.find((a) => a.board_id === board.id);
                    return {
                         ...board,
                         isAssigned: !!assignment,
                         assignmentId: assignment?.id,
                    };
               }),
          [allBoards, assignments],
     );

     const handleAssign = useCallback(
          async (boardId: string) => {
               if (!selectedClient) return;

               try {
                    await assign({ boardId, clientExternalId: selectedClient }).unwrap();
               } catch (error) {
                    console.error('Failed to assign board:', error);
                    alert('Nie udało się przypisać boarda');
               }
          },
          [selectedClient, assign],
     );

     const handleRemove = useCallback(
          async (boardClientId: string) => {
               if (!confirm('Czy na pewno chcesz odebrać klientowi dostęp do tego boarda?')) return;

               try {
                    await remove({ boardClientId }).unwrap();
               } catch (error) {
                    console.error('Failed to remove board:', error);
                    alert('Nie udało się usunąć przypisania');
               }
          },
          [remove],
     );

     const handleClearSearch = useCallback(() => {
          setSearchTerm('');
     }, []);

     if (authStatus === 'loading' || roleLoading) {
          return <Loader text="Ładowanie..." />;
     }

     if (authStatus === 'unauthenticated' || !hasManagementAccess()) {
          router.push('/');
          return null;
     }

     const isLoading = loadingClients || loadingBoards;
     const isProcessing = assigning || removing;
     const hasClients = filteredClients.length > 0;
     const hasBoards = allBoards.length > 0;

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <header className="mb-8">
                         <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                              Powrót
                         </button>
                         <h1 className="text-3xl font-bold text-white mb-2">Zarządzanie klientami</h1>
                         <p className="text-slate-400">Przypisuj i odbieraj dostęp do boardów</p>
                    </header>

                    <div className="relative mb-8">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <input
                              type="text"
                              placeholder="Szukaj klienta po nazwie lub emailu..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                         />
                         {searchTerm && (
                              <button
                                   onClick={handleClearSearch}
                                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                   aria-label="Wyczyść wyszukiwanie"
                              >
                                   <X className="w-5 h-5" />
                              </button>
                         )}
                    </div>

                    {isLoading ? (
                         <Loader text="Ładowanie danych..." />
                    ) : (
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <aside className="lg:col-span-1">
                                   <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 sticky top-4">
                                        <div className="flex items-center justify-between mb-4">
                                             <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                                  <Users className="w-5 h-5" />
                                                  Klienci
                                             </h2>
                                             <span className="text-sm text-slate-400 bg-slate-700 px-3 py-1 rounded-full">{filteredClients.length}</span>
                                        </div>

                                        {!hasClients ? (
                                             <div className="text-center py-12">
                                                  <p className="text-slate-400">{searchTerm ? 'Nie znaleziono klientów' : 'Brak klientów w systemie'}</p>
                                             </div>
                                        ) : (
                                             <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                                                  {filteredClients.map((client) => (
                                                       <button
                                                            key={client.id}
                                                            onClick={() => setSelectedClient(client.id)}
                                                            className={`w-full text-left p-4 rounded-xl flex items-center gap-3 border transition-all ${
                                                                 selectedClient === client.id
                                                                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg scale-[1.02]'
                                                                      : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/70 hover:border-purple-500/50 text-slate-200'
                                                            }`}
                                                       >
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                 {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                 <p className="font-medium truncate">{client.name || 'Bez nazwy'}</p>
                                                                 <p className="text-sm opacity-75 truncate">{client.email}</p>
                                                            </div>
                                                       </button>
                                                  ))}
                                             </div>
                                        )}
                                   </div>
                              </aside>

                              <main className="lg:col-span-2">
                                   {selectedClient ? (
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                             <div className="flex items-center justify-between mb-6">
                                                  <div>
                                                       <h2 className="text-xl font-semibold text-white mb-1">Dostęp do boardów</h2>
                                                       {selectedClientData && <p className="text-sm text-slate-400">{selectedClientData.name || selectedClientData.email}</p>}
                                                  </div>
                                                  {loadingAssignments && (
                                                       <div className="flex items-center gap-2 text-purple-400">
                                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                            <span className="text-sm">Aktualizacja...</span>
                                                       </div>
                                                  )}
                                             </div>

                                             {!hasBoards ? (
                                                  <div className="text-center py-20">
                                                       <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Users className="w-10 h-10 text-slate-500" />
                                                       </div>
                                                       <p className="text-slate-400 text-lg">Brak boardów w systemie</p>
                                                  </div>
                                             ) : (
                                                  <div className="space-y-3">
                                                       {boardsWithStatus.map((board) => (
                                                            <div
                                                                 key={board.id}
                                                                 className="flex items-center justify-between p-5 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                                                            >
                                                                 <div className="flex-1 min-w-0 mr-4">
                                                                      <h3 className="font-semibold text-white text-lg mb-1 truncate">{board.title}</h3>
                                                                      <p className="text-sm text-slate-400">
                                                                           {board._count?.tasks || 0} zadań • {board._count?.teamMembers || 0} członków
                                                                      </p>
                                                                 </div>

                                                                 {board.isAssigned ? (
                                                                      <button
                                                                           onClick={() => handleRemove(board.assignmentId!)}
                                                                           disabled={isProcessing}
                                                                           className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                                                      >
                                                                           <X className="w-4 h-4" />
                                                                           Odepnij
                                                                      </button>
                                                                 ) : (
                                                                      <button
                                                                           onClick={() => handleAssign(board.id)}
                                                                           disabled={isProcessing}
                                                                           className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                                                      >
                                                                           <Plus className="w-4 h-4" />
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
                                             <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                  <Users className="w-12 h-12 text-slate-500" />
                                             </div>
                                             <h3 className="text-2xl font-semibold text-white mb-2">Wybierz klienta</h3>
                                             <p className="text-slate-400 text-lg">Aby zarządzać jego dostępem do boardów</p>
                                        </div>
                                   )}
                              </main>
                         </div>
                    )}
               </div>
          </div>
     );
}

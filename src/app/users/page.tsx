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
import { ArrowLeft, X, Users, Search, ChevronRight, UserCheck, UserX, Check, Briefcase, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersManagementPage() {
     const { status: authStatus } = useSession();
     const router = useRouter();
     const { loading: roleLoading, hasManagementAccess } = useUserRole();

     const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
     const [searchTerm, setSearchTerm] = useState('');
     const [boardSearch, setBoardSearch] = useState('');
     const [visibleBoards, setVisibleBoards] = useState(5);

     const { data: clients = [] } = useGetAllClientsQuery();
     const { data: allBoards = [] } = useGetAllBoardsQuery();
     const { data: assignments = [], isFetching: loadingAssignments } = useGetClientBoardAssignmentsQuery(selectedClientId || '', { skip: !selectedClientId });
     const { data: allUsers = [], isLoading: loadingAllUsers } = useGetAllUsersQuery();

     const [assign, { isLoading: assigning }] = useAssignClientToBoardMutation();
     const [remove, { isLoading: removing }] = useRemoveClientFromBoardMutation();
     const [setUserRole, { isLoading: changingRole }] = useSetUserRoleMutation();

     const isProcessing = assigning || removing || changingRole;

     const filteredClients = useMemo(
          () => clients.filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase())),
          [clients, searchTerm],
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
     const filteredBoards = useMemo(() => boardsWithStatus.filter((b) => b.title.toLowerCase().includes(boardSearch.toLowerCase())), [boardsWithStatus, boardSearch]);
     const boardsToShow = useMemo(() => filteredBoards.slice(0, visibleBoards), [filteredBoards, visibleBoards]);
     const selectedClient = useMemo(() => clients.find((c) => c.id === selectedClientId), [clients, selectedClientId]);
     const assignedBoardsCount = useMemo(() => boardsWithStatus.filter((b) => b.isAssigned).length, [boardsWithStatus]);

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
               if (!confirm('Czy na pewno chcesz odebrać klientowi dostęp?')) return;
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
                    if (!promote && selectedClientId === userId) setSelectedClientId(null);
               } catch {
                    alert('Nie udało się zmienić roli');
               }
          },
          [setUserRole, selectedClientId],
     );

     const handleClearSearch = useCallback(() => setSearchTerm(''), []);
     const handleLoadMoreBoards = useCallback(() => setVisibleBoards((prev) => prev + 5), []);

     if (authStatus === 'loading' || roleLoading || loadingAllUsers) return <Loader text="Ładowanie..." />;
     if (authStatus === 'unauthenticated' || !hasManagementAccess()) {
          router.push('/');
          return null;
     }

     return (
          <div className="min-h-screen bg-slate-900 relative overflow-hidden">
               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-slate-800/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-slate-800/30 rounded-full blur-3xl" />
               </div>

               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
                    <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
                         <motion.button
                              whileHover={{ x: -4 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.back()}
                              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
                         >
                              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                              Powrót
                         </motion.button>
                         <motion.h1
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className="text-5xl font-bold text-white mb-3"
                         >
                              Zarządzanie użytkownikami
                         </motion.h1>
                         <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-slate-400 text-lg">
                              Przypisuj klientów do boardów oraz zarządzaj rolami
                         </motion.p>
                    </motion.header>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative mb-8">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                         <input
                              type="text"
                              placeholder="Szukaj po nazwie lub emailu..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg"
                         />
                         <AnimatePresence>
                              {searchTerm && (
                                   <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleClearSearch}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
                                   >
                                        <X className="w-5 h-5" />
                                   </motion.button>
                              )}
                         </AnimatePresence>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="lg:col-span-1">
                              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 sticky top-4 shadow-2xl">
                                   <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                                             <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                                  <Users className="w-6 h-6 text-blue-400" />
                                             </motion.div>
                                             Klienci
                                        </h2>
                                        <motion.span
                                             initial={{ scale: 0 }}
                                             animate={{ scale: 1 }}
                                             className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-400/30"
                                        >
                                             {filteredClients.length}
                                        </motion.span>
                                   </div>
                                   <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 pr-2 space-y-2">
                                        {filteredClients.length === 0 ? (
                                             <p className="text-slate-400 text-center py-8">Brak klientów</p>
                                        ) : (
                                             filteredClients.map((client, i) => (
                                                  <motion.button
                                                       key={client.id}
                                                       initial={{ opacity: 0, x: -20 }}
                                                       animate={{ opacity: 1, x: 0 }}
                                                       transition={{ delay: i * 0.05 }}
                                                       whileTap={{ scale: 0.98 }}
                                                       onClick={() => setSelectedClientId(client.id)}
                                                       className={`w-full text-left p-4 rounded-xl flex items-center cursor-pointer gap-3 border transition-all ${
                                                            selectedClientId === client.id
                                                                 ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                                                                 : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/70 hover:border-slate-600 text-slate-200'
                                                       }`}
                                                  >
                                                       <div
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                                                 selectedClientId === client.id ? 'bg-white/20' : 'bg-blue-600'
                                                            }`}
                                                       >
                                                            {client.name?.[0]?.toUpperCase() || '?'}
                                                       </div>
                                                       <div className="min-w-0 flex-1">
                                                            <p className="font-semibold truncate">{client.name || 'Bez nazwy'}</p>
                                                            <p className="text-sm opacity-75 truncate">{client.email}</p>
                                                       </div>
                                                       {selectedClientId === client.id && <ChevronRight className="w-5 h-5" />}
                                                  </motion.button>
                                             ))
                                        )}
                                   </div>
                              </div>
                         </motion.aside>

                         <motion.main initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="lg:col-span-2 space-y-6">
                              {selectedClientId ? (
                                   <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                                        {selectedClient && (
                                             <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700">
                                                  <div className="flex items-center gap-4 mb-3">
                                                       <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                                                            {selectedClient.name?.[0]?.toUpperCase() || '?'}
                                                       </div>
                                                       <div>
                                                            <h3 className="text-xl font-bold text-white">{selectedClient.name || 'Bez nazwy'}</h3>
                                                            <p className="text-slate-400">{selectedClient.email}</p>
                                                       </div>
                                                  </div>
                                                  <div className="flex gap-4 text-sm">
                                                       <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                            <span className="text-slate-400">Przypisane: </span>
                                                            <span className="text-white font-semibold">{assignedBoardsCount}</span>
                                                       </div>
                                                       <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                            <span className="text-slate-400">Wszystkie: </span>
                                                            <span className="text-white font-semibold">{allBoards.length}</span>
                                                       </div>
                                                  </div>
                                             </div>
                                        )}
                                        <div className="relative mb-4">
                                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                             <input
                                                  type="text"
                                                  placeholder="Szukaj boardu..."
                                                  value={boardSearch}
                                                  onChange={(e) => setBoardSearch(e.target.value)}
                                                  className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                             />
                                        </div>
                                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                                             <Briefcase className="w-6 h-6 text-blue-400" />
                                             Boardy klienta
                                        </h2>
                                        {loadingAssignments ? (
                                             <Loader text="Ładowanie..." />
                                        ) : boardsToShow.length === 0 ? (
                                             <p className="text-slate-400 text-center py-12">Brak boardów</p>
                                        ) : (
                                             <div className="space-y-3">
                                                  {boardsToShow.map((board, i) => (
                                                       <motion.div
                                                            key={board.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className={`relative flex items-center justify-between cursor-pointer p-5 rounded-xl border overflow-hidden ${
                                                                 board.isAssigned
                                                                      ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30'
                                                                      : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
                                                            }`}
                                                       >
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                 <div className="flex items-center gap-3 mb-2">
                                                                      <h3 className="font-semibold text-white truncate text-lg">{board.title}</h3>
                                                                      {board.isAssigned && (
                                                                           <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs border border-green-500/30">
                                                                                <Check className="w-3 h-3" />
                                                                                Przypisany
                                                                           </span>
                                                                      )}
                                                                 </div>
                                                                 <div className="flex gap-4 text-sm text-slate-400">
                                                                      <span>✓ {board._count?.tasks || 0} zadań</span>
                                                                      <span>👥 {board._count?.teamMembers || 0} członków</span>
                                                                 </div>
                                                            </div>
                                                            {board.isAssigned ? (
                                                                 <motion.button
                                                                      whileTap={{ scale: 0.95 }}
                                                                      onClick={() => handleRemove(board.assignmentId!)}
                                                                      disabled={isProcessing}
                                                                      className="px-5 py-2.5 bg-gradient-to-r cursor-pointer from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 shadow-lg flex items-center gap-2"
                                                                 >
                                                                      <UserX className="w-4 h-4" />
                                                                      Odepnij
                                                                 </motion.button>
                                                            ) : (
                                                                 <motion.button
                                                                      whileTap={{ scale: 0.95 }}
                                                                      onClick={() => handleAssign(board.id)}
                                                                      disabled={isProcessing}
                                                                      className="px-5 py-2.5 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 shadow-lg flex items-center gap-2"
                                                                 >
                                                                      <UserCheck className="w-4 h-4" />
                                                                      Przypisz
                                                                 </motion.button>
                                                            )}
                                                       </motion.div>
                                                  ))}
                                                  {visibleBoards < filteredBoards.length && (
                                                       <motion.button
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleLoadMoreBoards}
                                                            className="w-full mt-4 px-6 py-3 bg-slate-700/50 cursor-pointer hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl font-medium"
                                                       >
                                                            Załaduj więcej ({filteredBoards.length - visibleBoards})
                                                       </motion.button>
                                                  )}
                                             </div>
                                        )}
                                   </div>
                              ) : (
                                   <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-20 text-center shadow-2xl">
                                        <motion.div className="text-7xl mb-4">👈</motion.div>
                                        <p className="text-slate-400 text-lg">Wybierz klienta aby zarządzać boardami</p>
                                   </div>
                              )}

                              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                                   <h2 className="text-2xl font-semibold text-white mb-5 flex items-center gap-3">
                                        <Shield className="w-6 h-6 text-blue-400" />
                                        Wszyscy użytkownicy
                                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-400/30">{filteredUsers.length}</span>
                                   </h2>
                                   <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 pr-2 space-y-3">
                                        {filteredUsers.length === 0 ? (
                                             <p className="text-slate-400 text-center py-8">Brak użytkowników</p>
                                        ) : (
                                             filteredUsers.map((user, i) => (
                                                  <motion.div
                                                       key={user.id}
                                                       initial={{ opacity: 0, x: -20 }}
                                                       animate={{ opacity: 1, x: 0 }}
                                                       transition={{ delay: i * 0.03 }}
                                                       className="flex items-center justify-between cursor-pointer p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all"
                                                  >
                                                       <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                                                 {user.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                 <p className="font-medium text-white">{user.name || 'Bez nazwy'}</p>
                                                                 <p className="text-sm text-slate-400">{user.email}</p>
                                                                 <p className="text-xs text-slate-500 mt-1">Rola: {user.role || 'Brak'}</p>
                                                            </div>
                                                       </div>
                                                       {user.role === 'CLIENT' ? (
                                                            <motion.button
                                                                 whileTap={{ scale: 0.95 }}
                                                                 onClick={() => handleRoleChange(user.id, false)}
                                                                 disabled={isProcessing}
                                                                 className="px-3 py-1 bg-gradient-to-r cursor-pointer from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-lg text-sm disabled:opacity-50 shadow-lg"
                                                            >
                                                                 Odejmij CLIENT
                                                            </motion.button>
                                                       ) : (
                                                            <motion.button
                                                                 whileTap={{ scale: 0.95 }}
                                                                 onClick={() => handleRoleChange(user.id, true)}
                                                                 disabled={isProcessing}
                                                                 className="px-3 py-1 bg-gradient-to-r cursor-pointer from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm disabled:opacity-50 shadow-lg"
                                                            >
                                                                 Nadaj CLIENT
                                                            </motion.button>
                                                       )}
                                                  </motion.div>
                                             ))
                                        )}
                                   </div>
                              </div>
                         </motion.main>
                    </div>
               </div>
          </div>
     );
}

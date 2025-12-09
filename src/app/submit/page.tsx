'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubmissionForm } from '@/app/components/SubmissionForm/SubmissionForm';
import Loader from '@/app/components/Loader';
import { useGetClientBoardsQuery, useGetAllBoardsQuery } from '@/app/store/apiSlice';
import { supabase } from '@/app/lib/supabase';

export default function SubmitPage() {
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();
     const searchParams = useSearchParams();

     const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
     const [currentUserId, setCurrentUserId] = useState<string | null>(null);
     const [loadingUser, setLoadingUser] = useState(true);

     const boardIdFromUrl = searchParams.get('boardId');

     useEffect(() => {
          const fetchUser = async () => {
               if (authStatus !== 'authenticated' || !session?.user?.email) {
                    setLoadingUser(false);
                    return;
               }

               try {
                    const { data, error } = await supabase.from('users').select('id').eq('email', session.user.email).single();

                    if (!error && data) {
                         setCurrentUserId(data.id);
                    } else {
                         console.error('User not found:', error?.message);
                    }
               } catch (error) {
                    console.error('Error fetching user:', error);
               } finally {
                    setLoadingUser(false);
               }
          };

          fetchUser();
     }, [authStatus, session?.user?.email]);

     const { data: clientBoardIds = [], isLoading: loadingClientBoards } = useGetClientBoardsQuery(currentUserId || '', {
          skip: !currentUserId,
     });

     const { data: allBoards = [], isLoading: loadingAllBoards } = useGetAllBoardsQuery();

     const availableBoards = useMemo(() => {
          return allBoards.filter((board) => clientBoardIds.includes(board.id));
     }, [allBoards, clientBoardIds]);

     useEffect(() => {
          if (authStatus === 'unauthenticated') {
               router.push('/api/auth/signin?callbackUrl=/submit');
          }
     }, [authStatus, router]);

     useEffect(() => {
          if (boardIdFromUrl && clientBoardIds.includes(boardIdFromUrl)) {
               setSelectedBoardId(boardIdFromUrl);
          } else if (!boardIdFromUrl && availableBoards.length === 1) {
               setSelectedBoardId(availableBoards[0].id);
          }
     }, [boardIdFromUrl, clientBoardIds, availableBoards]);

     const handleBoardSelect = (boardId: string) => {
          setSelectedBoardId(boardId);
     };

     const handleSuccess = () => {
          router.push('/submissions');
     };

     const handleBack = () => {
          router.back();
     };

     const handleGoHome = () => {
          router.push('/');
     };

     const isLoading = authStatus === 'loading' || loadingUser || loadingClientBoards || loadingAllBoards;

     if (isLoading) {
          return <Loader text="Ładowanie..." />;
     }

     if (authStatus === 'unauthenticated') {
          return null;
     }

     if (availableBoards.length === 0) {
          return (
               <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 text-center">
                         <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                   />
                              </svg>
                         </div>
                         <h2 className="text-xl font-bold text-white mb-2">Brak dostępu</h2>
                         <p className="text-slate-400 mb-6">Nie masz przypisanych żadnych projektów. Skontaktuj się z administratorem.</p>
                         <button onClick={handleGoHome} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                              Powrót do strony głównej
                         </button>
                    </div>
               </div>
          );
     }

     const showBoardSelector = availableBoards.length > 1;
     const canShowForm = selectedBoardId && currentUserId;

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
               <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                    <div className="mb-8">
                         <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Powrót
                         </button>

                         <h1 className="text-3xl font-bold text-white mb-2">Nowe zgłoszenie</h1>
                         <p className="text-slate-400">Wypełnij formularz, aby wysłać zgłoszenie. Wszystkie pola oznaczone gwiazdką (*) są wymagane.</p>
                    </div>

                    {showBoardSelector && (
                         <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
                              <label htmlFor="board-select" className="block text-sm font-medium text-slate-300 mb-2">
                                   Wybierz projekt <span className="text-red-400">*</span>
                              </label>
                              <select
                                   id="board-select"
                                   value={selectedBoardId || ''}
                                   onChange={(e) => handleBoardSelect(e.target.value)}
                                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                   <option value="">-- Wybierz projekt --</option>
                                   {availableBoards.map((board) => (
                                        <option key={board.id} value={board.id}>
                                             {board.title}
                                        </option>
                                   ))}
                              </select>
                         </div>
                    )}

                    {selectedBoardId ? (
                         loadingUser ? (
                              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
                                   <Loader text="Ładowanie użytkownika..." />
                              </div>
                         ) : canShowForm ? (
                              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                                   <SubmissionForm boardId={selectedBoardId} userId={currentUserId} onSuccess={handleSuccess} />
                              </div>
                         ) : (
                              <div className="bg-slate-800/50 backdrop-blur-sm border border-red-700 rounded-lg p-12 text-center">
                                   <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                             <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                             />
                                        </svg>
                                   </div>
                                   <p className="text-red-400 font-medium mb-2">Błąd ładowania użytkownika</p>
                                   <p className="text-slate-400 text-sm">Nie można znaleźć Twojego konta w bazie danych</p>
                              </div>
                         )
                    ) : (
                         <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12 text-center">
                              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                   </svg>
                              </div>
                              <p className="text-slate-400">Wybierz projekt, aby rozpocząć zgłoszenie</p>
                         </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                         <h3 className="text-blue-400 font-medium mb-2">💡 Wskazówki</h3>
                         <ul className="text-sm text-slate-300 space-y-1">
                              <li>• Opisz problem jak najdokładniej</li>
                              <li>• Wybierz odpowiedni priorytet dla swojego zgłoszenia</li>
                              {showBoardSelector && <li>• Upewnij się, że wybrałeś właściwy projekt</li>}
                         </ul>
                    </div>
               </div>
          </div>
     );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubmissionForm } from '@/app/components/SubmissionForm/SubmissionForm';
import Loader from '@/app/components/Loader';
import { useGetClientBoardsQuery, useGetAllBoardsQuery } from '@/app/store/apiSlice';
import { getSupabase } from '@/app/lib/supabase';

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
                    const { data } = await getSupabase().from('users').select('id').eq('email', session.user.email).single();

                    if (data) {
                         setCurrentUserId(data.id);
                    }
               } finally {
                    setLoadingUser(false);
               }
          };

          fetchUser();
     }, [authStatus, session?.user?.email]);

     const { data: clientBoardIds = [], isLoading: loadingClientBoards } = useGetClientBoardsQuery(currentUserId || '', { skip: !currentUserId });

     const { data: allBoards = [], isLoading: loadingAllBoards } = useGetAllBoardsQuery();

     const availableBoards = useMemo(() => allBoards.filter((b) => clientBoardIds.includes(b.id)), [allBoards, clientBoardIds]);

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

     const isLoading = authStatus === 'loading' || loadingUser || loadingClientBoards || loadingAllBoards;

     if (isLoading) return <Loader text="Ładowanie..." />;
     if (authStatus === 'unauthenticated') return null;

     if (availableBoards.length === 0) {
          return (
               <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
                         <h2 className="text-xl font-bold text-white mb-2">Brak dostępu do projektów</h2>
                         <p className="text-slate-400 mb-6">
                              Aby wysyłać zgłoszenia, musisz mieć rangę <b>CLIENT</b> oraz być przypisanym do przynajmniej jednego projektu.
                         </p>
                         <button onClick={() => router.push('/')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                              Powrót do strony głównej
                         </button>
                    </div>
               </div>
          );
     }

     const showBoardSelector = availableBoards.length > 1;
     const canShowForm = selectedBoardId && currentUserId;

     return (
          <div className="min-h-screen bg-slate-900">
               <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                    <div className="mb-8">
                         <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6">
                              ← Powrót
                         </button>

                         <h1 className="text-3xl font-bold text-white mb-2">Nowe zgłoszenie</h1>
                         <p className="text-slate-400">
                              Zgłoszenia mogą wysyłać wyłącznie użytkownicy z rangą <b>CLIENT</b>, przypisani do danego projektu.
                         </p>
                    </div>

                    {showBoardSelector && (
                         <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                              <label className="block text-sm text-slate-300 mb-2">Wybierz projekt</label>
                              <select
                                   value={selectedBoardId || ''}
                                   onChange={(e) => setSelectedBoardId(e.target.value)}
                                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                              >
                                   <option value="">-- Wybierz projekt --</option>
                                   {availableBoards.map((b) => (
                                        <option key={b.id} value={b.id}>
                                             {b.title}
                                        </option>
                                   ))}
                              </select>
                         </div>
                    )}

                    {selectedBoardId && canShowForm ? (
                         <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                              <SubmissionForm boardId={selectedBoardId} userId={currentUserId} onSuccess={() => router.push('/submissions')} />
                         </div>
                    ) : (
                         <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                              <p className="text-slate-400">Wybierz projekt, aby rozpocząć tworzenie zgłoszenia.</p>
                         </div>
                    )}
               </div>
          </div>
     );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { SubmissionForm } from '@/app/components/SubmissionForm/SubmissionForm';
import Loader from '@/app/components/Loader';
import { useGetClientBoardsQuery, useGetAllBoardsQuery } from '@/app/store/apiSlice';
import { getSupabase } from '@/app/lib/supabase';

export default function SubmitPage() {
     const { t } = useTranslation();
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

     if (isLoading) return <Loader />;
     if (authStatus === 'unauthenticated') return null;

     if (availableBoards.length === 0) {
          return (
               <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
                         <h2 className="text-xl font-bold text-white mb-2">{t('submissions.noAccess')}</h2>
                         <p className="text-slate-400 mb-6">
                              {t('submissions.noAccessDesc')}
                         </p>
                         <button onClick={() => router.push('/')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg">
                              {t('submissions.backToHome')}
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
                              {t('submissions.back')}
                         </button>

                         <h1 className="text-3xl font-bold text-white mb-2">{t('submissions.newSubmissionTitle')}</h1>
                         <p className="text-slate-400">
                              {t('submissions.clientOnly')}
                         </p>
                    </div>

                    {showBoardSelector && (
                         <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                              <label className="block text-sm text-slate-300 mb-2">{t('submissions.selectProject')}</label>
                              <select
                                   value={selectedBoardId || ''}
                                   onChange={(e) => setSelectedBoardId(e.target.value)}
                                   className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                              >
                                   <option value="">{t('submissions.selectProjectPlaceholder')}</option>
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
                              <p className="text-slate-400">{t('submissions.selectProjectHint')}</p>
                         </div>
                    )}
               </div>
          </div>
     );
}

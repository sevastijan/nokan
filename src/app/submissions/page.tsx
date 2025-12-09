'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGetClientSubmissionsQuery, useUpdateSubmissionMutation, useDeleteSubmissionMutation } from '@/app/store/apiSlice';
import { supabase } from '@/app/lib/supabase';
import Loader from '@/app/components/Loader';
import { ClientSubmission as ImportedClientSubmission } from '@/app/types/globalTypes';

const priorityColors: Record<string, string> = {
     low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
     high: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
     urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const priorityLabels: Record<string, string> = {
     low: 'Niski',
     high: 'Wysoki',
     urgent: 'Pilny',
};

const allowedPriorities = ['low', 'high', 'urgent'] as const;
type Priority = (typeof allowedPriorities)[number];

const isValidPriority = (value: string | undefined | null): value is Priority => {
     return allowedPriorities.includes(value as Priority);
};

export default function SubmissionsPage() {
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();

     const [clientUuid, setClientUuid] = useState<string | null>(null);
     const [isFetchingUuid, setIsFetchingUuid] = useState(true);

     useEffect(() => {
          if (authStatus === 'authenticated' && session?.user?.email) {
               supabase
                    .from('users')
                    .select('id')
                    .eq('email', session.user.email)
                    .single()
                    .then(({ data }) => {
                         if (data?.id) setClientUuid(data.id);
                         setIsFetchingUuid(false);
                    });
          } else if (authStatus === 'unauthenticated') {
               setIsFetchingUuid(false);
          }
     }, [session?.user?.email, authStatus]);

     const {
          data: submissions = [],
          isLoading: loadingSubmissions,
          error,
     } = useGetClientSubmissionsQuery(clientUuid ?? '', {
          skip: !clientUuid || isFetchingUuid,
     });

     const [updateSubmission] = useUpdateSubmissionMutation();
     const [deleteSubmission] = useDeleteSubmissionMutation();

     const [editingId, setEditingId] = useState<string | null>(null);
     const [editForm, setEditForm] = useState({
          title: '',
          description: '',
     });

     if (authStatus === 'loading' || isFetchingUuid || loadingSubmissions) {
          return <Loader text="Ładowanie zgłoszeń..." />;
     }

     if (authStatus === 'unauthenticated') {
          router.push('/api/auth/signin');
          return null;
     }

     if (error) {
          return (
               <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                    <div className="text-center">
                         <p className="text-red-400 text-xl mb-6">Nie udało się załadować zgłoszeń</p>
                         <button onClick={() => window.location.reload()} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white">
                              Spróbuj ponownie
                         </button>
                    </div>
               </div>
          );
     }

     const startEdit = (submission: ImportedClientSubmission) => {
          setEditingId(submission.submission_id);
          setEditForm({
               title: submission.title,
               description: submission.description ?? '',
          });
     };

     const cancelEdit = () => {
          setEditingId(null);
          setEditForm({ title: '', description: '' });
     };

     const saveEdit = async (submissionId: string, taskId: string) => {
          try {
               await updateSubmission({
                    submissionId,
                    taskId,
                    data: editForm,
               }).unwrap();
               setEditingId(null);
          } catch {
               alert('Nie udało się zaktualizować zgłoszenia');
          }
     };

     const handleDelete = async (submissionId: string, taskId: string) => {
          if (!confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) return;
          try {
               await deleteSubmission({ submissionId, taskId }).unwrap();
          } catch {
               alert('Nie udało się usunąć zgłoszenia');
          }
     };

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
               <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex items-center justify-between mb-8">
                         <h1 className="text-3xl font-bold text-white">Moje zgłoszenia</h1>
                         <button onClick={() => router.push('/submit')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                              + Nowe zgłoszenie
                         </button>
                    </div>

                    {submissions.length === 0 ? (
                         <div className="text-center py-16">
                              <p className="text-slate-400 text-lg mb-6">Nie masz jeszcze żadnych zgłoszeń</p>
                              <button onClick={() => router.push('/submit')} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                                   Utwórz pierwsze zgłoszenie
                              </button>
                         </div>
                    ) : (
                         <div className="space-y-6">
                              {submissions.map((sub) => {
                                   const currentPriority = isValidPriority(sub.priority) ? sub.priority : 'low';

                                   return (
                                        <div key={sub.submission_id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 hover:border-purple-500/50 transition-all">
                                             {editingId === sub.submission_id ? (
                                                  <div className="space-y-4">
                                                       <input
                                                            type="text"
                                                            value={editForm.title}
                                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            placeholder="Tytuł"
                                                       />
                                                       <textarea
                                                            value={editForm.description}
                                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                            rows={4}
                                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            placeholder="Opis"
                                                       />
                                                       <div className="flex items-center gap-3">
                                                            <button onClick={() => saveEdit(sub.submission_id, sub.id)} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                                                                 Zapisz
                                                            </button>
                                                            <button onClick={cancelEdit} className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg">
                                                                 Anuluj
                                                            </button>
                                                       </div>
                                                  </div>
                                             ) : (
                                                  <>
                                                       <div className="flex items-start justify-between mb-4">
                                                            <h3 className="text-xl font-semibold text-white">{sub.title}</h3>
                                                            <div className="flex gap-2">
                                                                 <button onClick={() => startEdit(sub)} className="p-2 text-slate-400 hover:text-purple-400 transition" title="Edytuj">
                                                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                           <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                           />
                                                                      </svg>
                                                                 </button>
                                                                 <button
                                                                      onClick={() => handleDelete(sub.submission_id, sub.id)}
                                                                      className="p-2 text-slate-400 hover:text-red-400 transition"
                                                                      title="Usuń"
                                                                 >
                                                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                           <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                           />
                                                                      </svg>
                                                                 </button>
                                                            </div>
                                                       </div>

                                                       <p className="text-slate-300 mb-5 whitespace-pre-wrap">{sub.description || '—'}</p>

                                                       <div className="flex flex-wrap items-center gap-4 text-sm">
                                                            <div className={`px-4 py-1.5 rounded-full border ${priorityColors[currentPriority]}`}>
                                                                 <span className="font-medium">{priorityLabels[currentPriority]}</span>
                                                            </div>

                                                            {sub.status ? (
                                                                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-slate-700/30 border-slate-600/50">
                                                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.status.color || '#94a3b8' }} />
                                                                      <span className="text-slate-200 font-medium">{sub.status.label}</span>
                                                                 </div>
                                                            ) : (
                                                                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-slate-700/30 border-slate-600/50">
                                                                      <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                                                                      <span className="text-slate-400 font-medium">Brak statusu</span>
                                                                 </div>
                                                            )}

                                                            {sub.created_at && <span className="text-slate-500">Utworzono: {new Date(sub.created_at).toLocaleDateString('pl-PL')}</span>}
                                                       </div>
                                                  </>
                                             )}
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </div>
          </div>
     );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGetClientSubmissionsQuery, useGetAllSubmissionsQuery, useUpdateSubmissionMutation, useDeleteSubmissionMutation } from '@/app/store/apiSlice';
import { supabase } from '@/app/lib/supabase';
import Loader from '@/app/components/Loader';
import { ClientSubmission as ImportedClientSubmission } from '@/app/types/globalTypes';

type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'CLIENT' | 'MEMBER' | null;

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

const isValidPriority = (value: string | undefined | null): value is Priority => allowedPriorities.includes(value as Priority);

export default function SubmissionsPage() {
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();

     const [userId, setUserId] = useState<string | null>(null);
     const [userRole, setUserRole] = useState<UserRole>(null);
     const [loadingUser, setLoadingUser] = useState(true);

     useEffect(() => {
          if (authStatus === 'authenticated' && session?.user?.email) {
               supabase
                    .from('users')
                    .select('id, role')
                    .eq('email', session.user.email)
                    .single()
                    .then(({ data }) => {
                         if (data) {
                              setUserId(data.id);
                              setUserRole(data.role);
                         }
                         setLoadingUser(false);
                    });
          } else if (authStatus === 'unauthenticated') {
               setLoadingUser(false);
          }
     }, [authStatus, session?.user?.email]);

     const isAdmin = userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';

     const {
          data: clientSubmissions = [],
          isLoading: loadingClientSubmissions,
          error: clientError,
     } = useGetClientSubmissionsQuery(userId ?? '', {
          skip: !userId || loadingUser || isAdmin,
     });

     const {
          data: allSubmissions = [],
          isLoading: loadingAllSubmissions,
          error: allError,
     } = useGetAllSubmissionsQuery(undefined, {
          skip: !isAdmin || loadingUser,
     });

     const submissions = useMemo(() => (isAdmin ? allSubmissions : clientSubmissions), [isAdmin, allSubmissions, clientSubmissions]);

     const loadingSubmissions = loadingClientSubmissions || loadingAllSubmissions;
     const error = clientError || allError;

     const [updateSubmission] = useUpdateSubmissionMutation();
     const [deleteSubmission] = useDeleteSubmissionMutation();

     const [editingId, setEditingId] = useState<string | null>(null);
     const [editForm, setEditForm] = useState({ title: '', description: '' });

     if (authStatus === 'loading' || loadingUser || loadingSubmissions) {
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
               await updateSubmission({ submissionId, taskId, data: editForm }).unwrap();
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
                         <h1 className="text-3xl font-bold text-white">{isAdmin ? 'Wszystkie zgłoszenia' : 'Moje zgłoszenia'}</h1>
                         {!isAdmin && (
                              <button onClick={() => router.push('/submit')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                                   + Nowe zgłoszenie
                              </button>
                         )}
                    </div>

                    {submissions.length === 0 ? (
                         <div className="text-center py-16">
                              <p className="text-slate-400 text-lg">{isAdmin ? 'Brak zgłoszeń w systemie' : 'Nie masz jeszcze żadnych zgłoszeń'}</p>
                         </div>
                    ) : (
                         <div className="space-y-6">
                              {submissions.map((sub) => {
                                   const currentPriority = isValidPriority(sub.priority) ? sub.priority : 'low';
                                   const clientName = sub.client_name || 'Nieznany';
                                   const clientEmail = sub.client_email || 'Nieznany';
                                   const createdAt = sub.created_at ? new Date(sub.created_at).toLocaleDateString('pl-PL') : '—';
                                   const status = sub.status;

                                   return (
                                        <div key={sub.submission_id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 hover:border-purple-500/50 transition-all">
                                             {editingId === sub.submission_id ? (
                                                  <div className="space-y-4">
                                                       <input
                                                            type="text"
                                                            value={editForm.title}
                                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                       />
                                                       <textarea
                                                            value={editForm.description}
                                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                            rows={4}
                                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                       />
                                                       <div className="flex gap-3">
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
                                                       <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-xl font-semibold text-white">{sub.title}</h3>
                                                            <div className="flex gap-2">
                                                                 <button onClick={() => startEdit(sub)} className="p-2 text-slate-400 hover:text-purple-400 transition">
                                                                      ✏️
                                                                 </button>
                                                                 <button onClick={() => handleDelete(sub.submission_id, sub.id)} className="p-2 text-slate-400 hover:text-red-400 transition">
                                                                      🗑️
                                                                 </button>
                                                            </div>
                                                       </div>

                                                       {isAdmin && (
                                                            <p className="text-slate-400 text-sm mb-3">
                                                                 {clientName} ({clientEmail})
                                                            </p>
                                                       )}

                                                       <p className="text-slate-300 mb-4 whitespace-pre-wrap">{sub.description || '—'}</p>

                                                       <div className="flex flex-wrap items-center gap-4 text-sm">
                                                            <div className={`px-4 py-1.5 rounded-full border ${priorityColors[currentPriority]}`}>{priorityLabels[currentPriority]}</div>

                                                            {status && (
                                                                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-slate-700/30 border-slate-600/50">
                                                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                                                                      <span className="text-slate-200 font-medium">{status.label}</span>
                                                                 </div>
                                                            )}

                                                            <span className="text-slate-500">Utworzono: {createdAt}</span>
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

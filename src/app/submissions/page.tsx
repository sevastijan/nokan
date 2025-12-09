'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGetClientSubmissionsQuery, useGetAllSubmissionsQuery, useUpdateSubmissionMutation, useDeleteSubmissionMutation } from '@/app/store/apiSlice';
import { supabase } from '@/app/lib/supabase';
import Loader from '@/app/components/Loader';
import { ClientSubmission as ImportedClientSubmission } from '@/app/types/globalTypes';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'CLIENT' | 'MEMBER' | null;

const priorityColors: Record<string, string> = {
     low: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-400/40',
     high: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-400/40',
     urgent: 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-400/40',
};

const priorityLabels: Record<string, string> = {
     low: 'Niski',
     high: 'Wysoki',
     urgent: 'Pilny',
};

const allowedPriorities = ['low', 'high', 'urgent'] as const;
type Priority = (typeof allowedPriorities)[number];
const isValidPriority = (value: string | undefined | null): value is Priority => allowedPriorities.includes(value as Priority);

type SubmissionWithBoardTitle = ImportedClientSubmission & { board_title?: string };

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
     const isOwner = userRole === 'OWNER';

     const { data: clientSubmissions = [], isLoading: loadingClientSubmissions } = useGetClientSubmissionsQuery(userId ?? '', {
          skip: !userId || loadingUser || isAdmin,
     });

     const { data: allSubmissions = [], isLoading: loadingAllSubmissions } = useGetAllSubmissionsQuery(undefined, {
          skip: !isAdmin || loadingUser,
     });

     const submissions = useMemo(() => (isAdmin ? allSubmissions : clientSubmissions), [isAdmin, allSubmissions, clientSubmissions]);
     const loadingSubmissions = loadingClientSubmissions || loadingAllSubmissions;

     const [updateSubmission] = useUpdateSubmissionMutation();
     const [deleteSubmission] = useDeleteSubmissionMutation();

     const [editingId, setEditingId] = useState<string | null>(null);
     const [editForm, setEditForm] = useState({ title: '', description: '' });

     const groupedSubmissions = useMemo(() => {
          if (!submissions) return [];

          const map: Record<string, { subs: SubmissionWithBoardTitle[]; hasUrgent: boolean }> = {};

          (submissions as SubmissionWithBoardTitle[]).forEach((sub) => {
               const boardTitle = sub.board_title || sub.board_id || 'Nieznany board';
               if (!map[boardTitle]) map[boardTitle] = { subs: [], hasUrgent: false };
               map[boardTitle].subs.push(sub);
               if (sub.priority === 'urgent') map[boardTitle].hasUrgent = true;
          });

          const sorted = Object.entries(map)
               .sort(([, a], [, b]) => (b.hasUrgent ? 1 : 0) - (a.hasUrgent ? 1 : 0))
               .map(([board, data]) => ({ board, ...data }));

          return sorted;
     }, [submissions]);

     const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});

     if (authStatus === 'loading' || loadingUser || loadingSubmissions) {
          return <Loader text="Ładowanie zgłoszeń..." />;
     }

     if (authStatus === 'unauthenticated') {
          router.push('/api/auth/signin');
          return null;
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
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                         animate={{
                              scale: [1, 1.2, 1],
                              rotate: [0, 90, 0],
                              opacity: [0.03, 0.06, 0.03],
                         }}
                         transition={{
                              duration: 20,
                              repeat: Infinity,
                              ease: 'easeInOut',
                         }}
                         className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl"
                    />
                    <motion.div
                         animate={{
                              scale: [1.2, 1, 1.2],
                              rotate: [90, 0, 90],
                              opacity: [0.03, 0.06, 0.03],
                         }}
                         transition={{
                              duration: 25,
                              repeat: Infinity,
                              ease: 'easeInOut',
                         }}
                         className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500 to-cyan-500 rounded-full blur-3xl"
                    />
               </div>

               <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="flex items-center justify-between mb-12">
                         <div>
                              <motion.h1
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ duration: 0.6, delay: 0.1 }}
                                   className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2"
                              >
                                   {isAdmin ? 'Wszystkie zgłoszenia' : 'Moje zgłoszenia'}
                              </motion.h1>
                              <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-slate-400">
                                   {submissions.length} {submissions.length === 1 ? 'zgłoszenie' : 'zgłoszeń'}
                              </motion.p>
                         </div>
                         {!isAdmin && (
                              <motion.button
                                   initial={{ opacity: 0, scale: 0.9 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   whileHover={{ scale: 1.05, y: -2 }}
                                   whileTap={{ scale: 0.95 }}
                                   transition={{ duration: 0.2 }}
                                   onClick={() => router.push('/submit')}
                                   className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 overflow-hidden"
                              >
                                   <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                                        animate={{
                                             x: ['-100%', '200%'],
                                        }}
                                        transition={{
                                             duration: 2,
                                             repeat: Infinity,
                                             repeatDelay: 1,
                                        }}
                                   />
                                   <span className="relative flex items-center gap-2">
                                        <span className="text-2xl">+</span>
                                        Nowe zgłoszenie
                                   </span>
                              </motion.button>
                         )}
                    </motion.div>

                    {groupedSubmissions.length === 0 ? (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center py-24">
                              <motion.div
                                   animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0],
                                   }}
                                   transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                   }}
                                   className="text-7xl mb-6"
                              >
                                   📋
                              </motion.div>
                              <p className="text-slate-400 text-xl">{isAdmin ? 'Brak zgłoszeń w systemie' : 'Nie masz jeszcze żadnych zgłoszeń'}</p>
                         </motion.div>
                    ) : (
                         <div className="space-y-6">
                              {groupedSubmissions.map((group, groupIndex) => {
                                   const urgentClass = group.hasUrgent ? 'border-red-400/50 shadow-red-500/20' : 'border-slate-700/50';
                                   const isExpanded = expandedBoards[group.board] ?? false;

                                   return (
                                        <motion.div
                                             key={group.board}
                                             initial={{ opacity: 0, y: 20 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             transition={{ duration: 0.5, delay: groupIndex * 0.1 }}
                                             className={`border rounded-2xl backdrop-blur-xl bg-slate-900/40 shadow-2xl overflow-hidden ${urgentClass}`}
                                        >
                                             <motion.button
                                                  whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
                                                  whileTap={{ scale: 0.98 }}
                                                  onClick={() =>
                                                       setExpandedBoards((prev) => ({
                                                            ...prev,
                                                            [group.board]: !prev[group.board],
                                                       }))
                                                  }
                                                  className="w-full text-left px-8 py-5 bg-slate-800/50 text-white font-semibold flex justify-between items-center transition-all"
                                             >
                                                  <div className="flex items-center gap-4">
                                                       <span className="text-lg">{group.board}</span>
                                                       <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-400/30"
                                                       >
                                                            {group.subs.length}
                                                       </motion.span>
                                                  </div>
                                                  <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-xl">
                                                       ▼
                                                  </motion.span>
                                             </motion.button>

                                             <AnimatePresence initial={false}>
                                                  {isExpanded && (
                                                       <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                                            className="overflow-hidden"
                                                       >
                                                            <div className="px-6 py-6 space-y-4">
                                                                 {group.subs.map((sub, subIndex) => {
                                                                      const currentPriority = isValidPriority(sub.priority) ? sub.priority : 'low';
                                                                      const createdAt = sub.created_at ? new Date(sub.created_at).toLocaleDateString('pl-PL') : '—';
                                                                      const status = sub.status;

                                                                      return (
                                                                           <motion.div
                                                                                key={sub.submission_id}
                                                                                layout
                                                                                initial={{ opacity: 0, x: -20 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                exit={{ opacity: 0, x: 20 }}
                                                                                transition={{
                                                                                     duration: 0.4,
                                                                                     delay: subIndex * 0.05,
                                                                                     ease: [0.4, 0, 0.2, 1],
                                                                                }}
                                                                                whileHover={{
                                                                                     scale: 1.01,
                                                                                     y: -2,
                                                                                     transition: { duration: 0.2 },
                                                                                }}
                                                                                className={`group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer overflow-hidden ${
                                                                                     currentPriority === 'urgent' ? 'ring-2 ring-red-500/50' : ''
                                                                                }`}
                                                                                onClick={() => {
                                                                                     if (isOwner && !editingId) {
                                                                                          router.push(`/board/${sub.id}`);
                                                                                     }
                                                                                }}
                                                                           >
                                                                                <motion.div
                                                                                     className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0"
                                                                                     initial={{ x: '-100%' }}
                                                                                     whileHover={{ x: '100%' }}
                                                                                     transition={{ duration: 0.6 }}
                                                                                />

                                                                                {editingId === sub.submission_id && !isOwner ? (
                                                                                     <div className="space-y-4 relative z-10" onClick={(e) => e.stopPropagation()}>
                                                                                          <motion.input
                                                                                               initial={{ opacity: 0, y: -10 }}
                                                                                               animate={{ opacity: 1, y: 0 }}
                                                                                               type="text"
                                                                                               value={editForm.title}
                                                                                               onChange={(e) =>
                                                                                                    setEditForm({
                                                                                                         ...editForm,
                                                                                                         title: e.target.value,
                                                                                                    })
                                                                                               }
                                                                                               className="w-full px-5 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                                                          />
                                                                                          <motion.textarea
                                                                                               initial={{ opacity: 0, y: -10 }}
                                                                                               animate={{ opacity: 1, y: 0 }}
                                                                                               transition={{ delay: 0.1 }}
                                                                                               value={editForm.description}
                                                                                               onChange={(e) =>
                                                                                                    setEditForm({
                                                                                                         ...editForm,
                                                                                                         description: e.target.value,
                                                                                                    })
                                                                                               }
                                                                                               rows={4}
                                                                                               className="w-full px-5 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                                                          />
                                                                                          <div className="flex gap-3">
                                                                                               <motion.button
                                                                                                    whileHover={{ scale: 1.05 }}
                                                                                                    whileTap={{ scale: 0.95 }}
                                                                                                    onClick={() => saveEdit(sub.submission_id, sub.id)}
                                                                                                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-green-500/20 transition-all"
                                                                                               >
                                                                                                    Zapisz
                                                                                               </motion.button>
                                                                                               <motion.button
                                                                                                    whileHover={{ scale: 1.05 }}
                                                                                                    whileTap={{ scale: 0.95 }}
                                                                                                    onClick={cancelEdit}
                                                                                                    className="px-6 py-2.5 bg-slate-600/80 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
                                                                                               >
                                                                                                    Anuluj
                                                                                               </motion.button>
                                                                                          </div>
                                                                                     </div>
                                                                                ) : (
                                                                                     <div className="relative z-10">
                                                                                          <div className="flex items-start justify-between mb-3">
                                                                                               <h3 className="text-xl font-semibold text-white pr-4">{sub.title}</h3>
                                                                                               {!isOwner && (
                                                                                                    <div
                                                                                                         className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                         onClick={(e) => e.stopPropagation()}
                                                                                                    >
                                                                                                         <motion.button
                                                                                                              whileHover={{ scale: 1.2, rotate: 15 }}
                                                                                                              whileTap={{ scale: 0.9 }}
                                                                                                              onClick={(e) => {
                                                                                                                   e.stopPropagation();
                                                                                                                   startEdit(sub);
                                                                                                              }}
                                                                                                              className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-all"
                                                                                                         >
                                                                                                              ✏️
                                                                                                         </motion.button>
                                                                                                         <motion.button
                                                                                                              whileHover={{ scale: 1.2, rotate: -15 }}
                                                                                                              whileTap={{ scale: 0.9 }}
                                                                                                              onClick={(e) => {
                                                                                                                   e.stopPropagation();
                                                                                                                   handleDelete(sub.submission_id, sub.id);
                                                                                                              }}
                                                                                                              className="p-2.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                                                                                                         >
                                                                                                              🗑️
                                                                                                         </motion.button>
                                                                                                    </div>
                                                                                               )}
                                                                                          </div>

                                                                                          <p className="text-slate-300/90 mb-5 whitespace-pre-wrap leading-relaxed">{sub.description || '—'}</p>

                                                                                          <div className="flex flex-wrap items-center gap-3 text-sm">
                                                                                               <motion.div
                                                                                                    whileHover={{ scale: 1.05 }}
                                                                                                    className={`px-4 py-2 rounded-xl border font-medium backdrop-blur-sm ${priorityColors[currentPriority]}`}
                                                                                               >
                                                                                                    {priorityLabels[currentPriority]}
                                                                                               </motion.div>

                                                                                               {status && (
                                                                                                    <motion.div
                                                                                                         whileHover={{ scale: 1.05 }}
                                                                                                         className="flex items-center gap-2.5 px-4 py-2 rounded-xl border bg-slate-700/30 border-slate-600/50 backdrop-blur-sm"
                                                                                                    >
                                                                                                         <motion.div
                                                                                                              animate={{
                                                                                                                   scale: [1, 1.2, 1],
                                                                                                                   opacity: [0.7, 1, 0.7],
                                                                                                              }}
                                                                                                              transition={{
                                                                                                                   duration: 2,
                                                                                                                   repeat: Infinity,
                                                                                                              }}
                                                                                                              className="w-2.5 h-2.5 rounded-full shadow-lg"
                                                                                                              style={{
                                                                                                                   backgroundColor: status.color,
                                                                                                                   boxShadow: `0 0 10px ${status.color}`,
                                                                                                              }}
                                                                                                         />
                                                                                                         <span className="text-slate-200 font-medium">{status.label}</span>
                                                                                                    </motion.div>
                                                                                               )}

                                                                                               <span className="text-slate-500 flex items-center gap-2">
                                                                                                    <span className="opacity-50">📅</span>
                                                                                                    {createdAt}
                                                                                               </span>
                                                                                          </div>
                                                                                     </div>
                                                                                )}
                                                                           </motion.div>
                                                                      );
                                                                 })}
                                                            </div>
                                                       </motion.div>
                                                  )}
                                             </AnimatePresence>
                                        </motion.div>
                                   );
                              })}
                         </div>
                    )}
               </div>
          </div>
     );
}

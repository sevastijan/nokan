'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGetClientSubmissionsQuery, useGetAllSubmissionsQuery, useUpdateSubmissionMutation, useDeleteSubmissionMutation } from '@/app/store/apiSlice';
import { getSupabase } from '@/app/lib/supabase';
import Loader from '@/app/components/Loader';
import { ClientSubmission as ImportedClientSubmission } from '@/app/types/globalTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Calendar, Pencil, Trash2, AlertTriangle, Inbox, LayoutList, Save, X } from 'lucide-react';

type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'CLIENT' | 'MEMBER' | null;

const priorityConfig: Record<string, { labelKey: string; color: string; bg: string; border: string; dot: string }> = {
     low: { labelKey: 'submissions.priorityLow', color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: 'bg-purple-400' },
     high: { labelKey: 'submissions.priorityHigh', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
     urgent: { labelKey: 'submissions.priorityUrgent', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' },
};

const allowedPriorities = ['low', 'high', 'urgent'] as const;
type Priority = (typeof allowedPriorities)[number];
const isValidPriority = (value: string | undefined | null): value is Priority => allowedPriorities.includes(value as Priority);

type SubmissionWithBoardTitle = ImportedClientSubmission & { board_title?: string };

export default function SubmissionsPage() {
     const { t } = useTranslation();
     const { data: session, status: authStatus } = useSession();
     const router = useRouter();

     const [userId, setUserId] = useState<string | null>(null);
     const [userRole, setUserRole] = useState<UserRole>(null);
     const [loadingUser, setLoadingUser] = useState(true);

     useEffect(() => {
          if (authStatus === 'authenticated' && session?.user?.email) {
               getSupabase()
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
               const boardTitle = sub.board_title || sub.board_id || t('common.unknown');
               if (!map[boardTitle]) map[boardTitle] = { subs: [], hasUrgent: false };
               map[boardTitle].subs.push(sub);
               if (sub.priority === 'urgent') map[boardTitle].hasUrgent = true;
          });

          const sorted = Object.entries(map)
               .sort(([, a], [, b]) => (b.hasUrgent ? 1 : 0) - (a.hasUrgent ? 1 : 0))
               .map(([board, data]) => ({ board, ...data }));

          return sorted;
     }, [submissions, t]);

     const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});

     if (authStatus === 'loading' || loadingUser || loadingSubmissions) {
          return <Loader text={t('submissions.loadingSubmissions')} />;
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
               alert(t('submissions.submitFailed'));
          }
     };

     const handleDelete = async (submissionId: string, taskId: string) => {
          if (!confirm(t('common.delete') + '?')) return;
          try {
               await deleteSubmission({ submissionId, taskId }).unwrap();
          } catch {
               alert(t('submissions.submitFailed'));
          }
     };

     const urgentCount = submissions.filter((s) => s.priority === 'urgent').length;

     return (
          <div className="min-h-screen bg-slate-900">
               <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                         <div className="flex items-start justify-between">
                              <div>
                                   <h1 className="text-3xl font-bold text-white mb-1">{isAdmin ? t('submissions.allSubmissions') : t('submissions.mySubmissions')}</h1>
                                   <div className="flex items-center gap-3 mt-2">
                                        <span className="text-sm text-slate-400">
                                             {submissions.length} {t('submissions.submission', { count: submissions.length })}
                                        </span>
                                        {urgentCount > 0 && (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  {urgentCount} {t('submissions.urgent')}
                                             </span>
                                        )}
                                   </div>
                              </div>
                              {!isAdmin && (
                                   <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push('/submit')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-600/20 transition-colors cursor-pointer"
                                   >
                                        <Plus className="w-4 h-4" />
                                        {t('submissions.newSubmission')}
                                   </motion.button>
                              )}
                         </div>
                    </motion.div>

                    {/* Empty state */}
                    {groupedSubmissions.length === 0 ? (
                         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center py-20">
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-4">
                                   <Inbox className="w-7 h-7 text-slate-500" />
                              </div>
                              <p className="text-slate-400 text-base">{isAdmin ? t('submissions.noSubmissions') : t('submissions.noMySubmissions')}</p>
                         </motion.div>
                    ) : (
                         <div className="space-y-4">
                              {groupedSubmissions.map((group, groupIndex) => {
                                   const isExpanded = expandedBoards[group.board] ?? false;

                                   return (
                                        <motion.div
                                             key={group.board}
                                             initial={{ opacity: 0, y: 12 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             transition={{ duration: 0.35, delay: groupIndex * 0.06 }}
                                             className="rounded-xl bg-slate-800/40 border border-slate-700/40 overflow-hidden"
                                        >
                                             {/* Board group header */}
                                             <button
                                                  onClick={() =>
                                                       setExpandedBoards((prev) => ({
                                                            ...prev,
                                                            [group.board]: !prev[group.board],
                                                       }))
                                                  }
                                                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors cursor-pointer"
                                             >
                                                  <div className="flex items-center gap-3">
                                                       <LayoutList className="w-4 h-4 text-slate-500" />
                                                       <span className="text-sm font-semibold text-white">{group.board}</span>
                                                       <span className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400 text-xs font-medium">{group.subs.length}</span>
                                                       {group.hasUrgent && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                                                 <AlertTriangle className="w-3 h-3" />
                                                                 {t('submissions.priorityUrgent')}
                                                            </span>
                                                       )}
                                                  </div>
                                                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                                       <ChevronDown className="w-4 h-4 text-slate-500" />
                                                  </motion.div>
                                             </button>

                                             {/* Submission items */}
                                             <AnimatePresence initial={false}>
                                                  {isExpanded && (
                                                       <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                            className="overflow-hidden"
                                                       >
                                                            <div className="px-5 pb-4 space-y-2">
                                                                 {group.subs.map((sub, subIndex) => {
                                                                      const currentPriority = isValidPriority(sub.priority) ? sub.priority : 'low';
                                                                      const prio = priorityConfig[currentPriority];
                                                                      const createdAt = sub.created_at ? new Date(sub.created_at).toLocaleDateString('pl-PL') : '—';
                                                                      const status = sub.status;

                                                                      return (
                                                                           <motion.div
                                                                                key={sub.submission_id}
                                                                                layout
                                                                                initial={{ opacity: 0, y: 8 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                exit={{ opacity: 0, y: -8 }}
                                                                                transition={{ duration: 0.25, delay: subIndex * 0.03 }}
                                                                                className={`group relative flex gap-4 bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 hover:bg-slate-800/70 hover:border-slate-600/40 transition-all ${
                                                                                     isOwner && !editingId ? 'cursor-pointer' : ''
                                                                                }`}
                                                                                onClick={() => {
                                                                                     if (isOwner && !editingId) {
                                                                                          router.push(`/board/${sub.id}`);
                                                                                     }
                                                                                }}
                                                                           >
                                                                                {/* Priority left bar */}
                                                                                <div className={`flex-shrink-0 w-1 rounded-full ${prio.dot}`} />

                                                                                {/* Content */}
                                                                                <div className="flex-1 min-w-0">
                                                                                     {editingId === sub.submission_id && !isOwner ? (
                                                                                          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                                                               <input
                                                                                                    type="text"
                                                                                                    value={editForm.title}
                                                                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                                                                    className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                                                                               />
                                                                                               <textarea
                                                                                                    value={editForm.description}
                                                                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                                                    rows={3}
                                                                                                    className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600/50 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                                                                               />
                                                                                               <div className="flex gap-2">
                                                                                                    <button
                                                                                                         onClick={() => saveEdit(sub.submission_id, sub.id)}
                                                                                                         className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                                                                    >
                                                                                                         <Save className="w-3 h-3" />
                                                                                                         {t('common.save')}
                                                                                                    </button>
                                                                                                    <button
                                                                                                         onClick={cancelEdit}
                                                                                                         className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-600/60 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                                                                    >
                                                                                                         <X className="w-3 h-3" />
                                                                                                         {t('common.cancel')}
                                                                                                    </button>
                                                                                               </div>
                                                                                          </div>
                                                                                     ) : (
                                                                                          <>
                                                                                               <div className="flex items-start justify-between gap-3 mb-1.5">
                                                                                                    <h3 className="text-sm font-semibold text-white leading-snug">{sub.title}</h3>
                                                                                                    {!isOwner && (
                                                                                                         <div
                                                                                                              className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                              onClick={(e) => e.stopPropagation()}
                                                                                                         >
                                                                                                              <button
                                                                                                                   onClick={(e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        startEdit(sub);
                                                                                                                   }}
                                                                                                                   className="p-1.5 rounded-md text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
                                                                                                                   title={t('common.edit')}
                                                                                                              >
                                                                                                                   <Pencil className="w-3.5 h-3.5" />
                                                                                                              </button>
                                                                                                              <button
                                                                                                                   onClick={(e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        handleDelete(sub.submission_id, sub.id);
                                                                                                                   }}
                                                                                                                   className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                                                                                                   title={t('common.delete')}
                                                                                                              >
                                                                                                                   <Trash2 className="w-3.5 h-3.5" />
                                                                                                              </button>
                                                                                                         </div>
                                                                                                    )}
                                                                                               </div>

                                                                                               {sub.description && (
                                                                                                    <p className="text-xs text-slate-400 mb-3 whitespace-pre-wrap leading-relaxed line-clamp-2">{sub.description}</p>
                                                                                               )}

                                                                                               <div className="flex flex-wrap items-center gap-2">
                                                                                                    {/* Priority badge */}
                                                                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${prio.bg} ${prio.border} ${prio.color}`}>
                                                                                                         <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                                                                                                         {t(prio.labelKey)}
                                                                                                    </span>

                                                                                                    {/* Status badge */}
                                                                                                    {status && (
                                                                                                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-700/40 border border-slate-600/30 text-xs text-slate-300">
                                                                                                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                                                                                              {status.label}
                                                                                                         </span>
                                                                                                    )}

                                                                                                    {/* Date */}
                                                                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                                                                         <Calendar className="w-3 h-3" />
                                                                                                         {createdAt}
                                                                                                    </span>
                                                                                               </div>
                                                                                          </>
                                                                                     )}
                                                                                </div>
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

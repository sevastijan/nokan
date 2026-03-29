'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useGetTaskSnapshotsQuery, useAddNotificationMutation } from '@/app/store/apiSlice';
import { getSupabase } from '@/app/lib/supabase';
import type { Comment, TaskSnapshot, Column, User, TaskDetail } from '@/app/types/globalTypes';
import { extractMentionedUserIds } from '@/app/lib/mentionUtils';
import { triggerEmailNotification } from '@/app/lib/email/triggerNotification';
import CommentForm from './CommentForm';
import Avatar from '../Avatar/Avatar';
import { formatDate } from '@/app/utils/helpers';
import MarkdownContent from '../MarkdownContent/MarkdownContent';

type FilterType = 'all' | 'comments' | 'history';

interface ActivityFeedProps {
     taskId: string;
     comments: Comment[];
     currentUser: User;
     task: TaskDetail | null;
     columns: Column[];
     teamMembers: User[];
     boardId?: string;
     boardName?: string;
     taskTitle?: string;
     onRefreshComments: () => Promise<void>;
     onImagePreview: (url: string) => void;
     onRestore?: () => void;
}

type ActivityItem =
     | { type: 'comment'; date: string; data: Comment }
     | { type: 'history'; date: string; data: TaskSnapshot };

const FIELD_LABELS: Record<string, string> = {
     title: 'tytuł', description: 'opis', priority: 'priorytet', column_id: 'status',
     user_id: 'przypisanie', completed: 'zakończenie', status_id: 'status',
     due_date: 'termin', start_date: 'datę rozpoczęcia', end_date: 'datę zakończenia', type: 'typ',
};

function getDisplayData(user: { name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string } | null) {
     if (!user) return { name: 'System', image: '' };
     return { name: user.custom_name || user.name || user.email || 'Użytkownik', image: user.custom_image || user.image || '' };
}

function timeAgo(dateStr: string): string {
     const now = new Date();
     const date = new Date(dateStr);
     const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
     if (diffMin < 1) return 'przed chwilą';
     if (diffMin < 60) return `${diffMin} min temu`;
     const diffH = Math.floor(diffMin / 60);
     if (diffH < 24) return `${diffH} godz. temu`;
     const diffD = Math.floor(diffH / 24);
     if (diffD < 7) return `${diffD} dn. temu`;
     return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

function HistoryItem({ snapshot, columns }: { snapshot: TaskSnapshot; columns: Column[] }) {
     const user = getDisplayData(snapshot.changed_by_user || null);
     const fields = (snapshot.changed_fields || []).filter((f) => f !== 'updated_at' && f !== 'sort_order');
     if (fields.length === 0) return null;

     const getSummary = (field: string): string => {
          const val = snapshot.snapshot?.[field];
          if (field === 'column_id' && typeof val === 'string') {
               const col = columns.find((c) => c.id === val);
               return `przeniósł(a) do "${col?.title || 'Nieznana'}"`;
          }
          if (field === 'completed') return val ? 'oznaczył(a) jako zakończone' : 'przywrócił(a) do aktywnych';
          if (field === 'title') return 'zmienił(a) tytuł';
          if (field === 'description') return 'zaktualizował(a) opis';
          if (field === 'type') {
               const typeLabels: Record<string, string> = { task: 'Zadanie', story: 'Story', bug: 'Błąd' };
               return `zmienił(a) typ na ${typeLabels[val as string] || val}`;
          }
          return `zmienił(a) ${FIELD_LABELS[field] || field}`;
     };

     const summary = fields.length === 1 ? getSummary(fields[0]) : `zmienił(a) ${fields.map((f) => FIELD_LABELS[f] || f).join(', ')}`;

     return (
          <div className="flex gap-3 py-2.5">
               <div className="shrink-0 mt-0.5">
                    {user.image ? <Avatar src={user.image} alt={user.name} size={28} /> : (
                         <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                         </div>
                    )}
               </div>
               <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                         <span className="text-sm font-medium text-slate-200">{user.name}</span>
                         <span className="text-xs text-slate-600">{timeAgo(snapshot.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{summary}</p>
               </div>
          </div>
     );
}

function CommentItem({ comment, onImagePreview }: { comment: Comment; onImagePreview: (url: string) => void }) {
     const author = getDisplayData(comment.author);
     return (
          <div className="flex gap-3 py-2.5">
               <div className="shrink-0 mt-0.5">
                    <Avatar src={author.image} alt={author.name} size={28} />
               </div>
               <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                         <span className="text-sm font-medium text-slate-200">{author.name}</span>
                         <span className="text-xs text-slate-600">{timeAgo(comment.created_at)}</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-0.5 [&_p]:my-0 [&_p]:leading-relaxed">
                         <MarkdownContent content={comment.content} onImageClick={onImagePreview} />
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                         <div className="mt-2 ml-2 pl-3 border-l border-slate-800 space-y-2">
                              {comment.replies.map((reply) => {
                                   const replyAuthor = getDisplayData(reply.author);
                                   return (
                                        <div key={reply.id} className="flex gap-3 py-1">
                                             <Avatar src={replyAuthor.image} alt={replyAuthor.name} size={28} />
                                             <div className="min-w-0">
                                                  <div className="flex items-baseline gap-2">
                                                       <span className="text-sm font-medium text-slate-200">{replyAuthor.name}</span>
                                                       <span className="text-xs text-slate-600">{timeAgo(reply.created_at)}</span>
                                                  </div>
                                                  <div className="text-sm text-slate-300 mt-0.5 [&_p]:my-0 [&_p]:leading-relaxed">
                                                       <MarkdownContent content={reply.content} onImageClick={onImagePreview} />
                                                  </div>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </div>
          </div>
     );
}

function HeightAnimator({ children }: { children: React.ReactNode }) {
     const containerRef = useRef<HTMLDivElement>(null);
     const [height, setHeight] = useState<number | 'auto'>('auto');

     useEffect(() => {
          if (!containerRef.current) return;
          const observer = new ResizeObserver((entries) => {
               for (const entry of entries) {
                    setHeight(entry.contentRect.height);
               }
          });
          observer.observe(containerRef.current);
          return () => observer.disconnect();
     }, []);

     return (
          <motion.div
               animate={{ height }}
               transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
               style={{ overflow: 'hidden' }}
          >
               <div ref={containerRef}>{children}</div>
          </motion.div>
     );
}

export default function ActivityFeed({ taskId, comments, currentUser, task, columns, teamMembers, boardId, boardName, taskTitle, onRefreshComments, onImagePreview }: ActivityFeedProps) {
     const { t } = useTranslation();
     const [filter, setFilter] = useState<FilterType>('all');
     const [addNotification] = useAddNotificationMutation();
     const { data: snapshots = [] } = useGetTaskSnapshotsQuery(taskId, { skip: !taskId });

     const addComment = useCallback(async (content: string, parentId?: string) => {
          if (!content.trim() || !taskId) return;
          try {
               const { error } = await getSupabase().from('task_comments').insert({
                    task_id: taskId, user_id: currentUser.id, content: content.trim(), parent_id: parentId || null,
               });
               if (error) throw error;

               const mentionedIds = extractMentionedUserIds(content, teamMembers);
               const currentUserName = currentUser.custom_name || currentUser.name || t('common.unknown');
               const title = taskTitle || task?.title || 'zadanie';
               for (const mentionedId of mentionedIds) {
                    if (mentionedId === currentUser.id) continue;
                    addNotification({ user_id: mentionedId, type: 'mention', task_id: taskId, board_id: boardId, message: t('comments.mentionInComment', { name: currentUserName, title }) });
                    if (boardId) {
                         triggerEmailNotification({ type: 'mention', taskId, taskTitle: title, boardId, boardName, recipientId: mentionedId, metadata: { mentionerName: currentUserName, commentPreview: content.substring(0, 100) } });
                    }
               }
               await onRefreshComments();
               toast.success(parentId ? t('comments.replyAdded') : t('comments.added'));
          } catch (error) {
               console.error('Error adding comment:', error);
               toast.error(t('comments.addFailed'));
          }
     }, [taskId, currentUser, teamMembers, boardId, boardName, taskTitle, task, onRefreshComments, addNotification, t]);

     const filters: { value: FilterType; label: string }[] = [
          { value: 'all', label: 'Wszystko' },
          { value: 'comments', label: 'Komentarze' },
          { value: 'history', label: 'Historia' },
     ];

     const timeline = useMemo(() => {
          const items: ActivityItem[] = [];
          if (filter !== 'history') {
               for (const c of comments) items.push({ type: 'comment', date: c.created_at, data: c });
          }
          if (filter !== 'comments') {
               for (const s of snapshots) {
                    const fields = (s.changed_fields || []).filter((f) => f !== 'updated_at' && f !== 'sort_order');
                    if (fields.length > 0) items.push({ type: 'history', date: s.created_at, data: s });
               }
          }
          items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return items;
     }, [comments, snapshots, filter]);

     return (
          <div>
               <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-0.5">
                         {filters.map((f) => (
                              <button
                                   key={f.value}
                                   onClick={() => setFilter(f.value)}
                                   className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer ${
                                        filter === f.value ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
                                   }`}
                              >
                                   {f.label}
                              </button>
                         ))}
                    </div>
               </div>

               <HeightAnimator>
               <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                         key={filter}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.15 }}
                    >
                         {timeline.length === 0 ? (
                              <p className="text-xs text-slate-600 py-4 text-center">Brak aktywności</p>
                         ) : (
                              timeline.map((item) =>
                                   item.type === 'history'
                                        ? <HistoryItem key={`h-${item.data.id}`} snapshot={item.data as TaskSnapshot} columns={columns} />
                                        : <CommentItem key={`c-${(item.data as Comment).id}`} comment={item.data as Comment} onImagePreview={onImagePreview} />
                              )
                         )}

                         {/* Created entry - last in timeline */}
                         {task?.created_at && (
                              <div className="flex gap-3 py-2.5">
                                   <div className="shrink-0 mt-0.5">
                                        {task.creator ? (
                                             <Avatar src={task.creator.custom_image || task.creator.image || ''} alt={task.creator.custom_name || task.creator.name || ''} size={28} />
                                        ) : (
                                             <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                             </div>
                                        )}
                                   </div>
                                   <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                             <span className="text-sm font-medium text-slate-200">{task.creator?.custom_name || task.creator?.name || 'Użytkownik'}</span>
                                             <span className="text-xs text-slate-600">{timeAgo(task.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-0.5">utworzył(a) zadanie</p>
                                   </div>
                              </div>
                         )}

                         {/* Comment form - after all entries */}
                         {filter !== 'history' && (
                              <div className="mt-4 pt-3 border-t border-slate-800/40">
                                   <CommentForm currentUser={currentUser} taskId={taskId} onAddComment={addComment} teamMembers={teamMembers} />
                              </div>
                         )}
                    </motion.div>
               </AnimatePresence>
               </HeightAnimator>
          </div>
     );
}

import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { CommentsSectionProps } from '@/app/types/globalTypes';
import { User } from '@/app/types/globalTypes';
import { extractMentionedUserIds } from '@/app/lib/mentionUtils';
import { useAddNotificationMutation } from '@/app/store/apiSlice';
import { triggerEmailNotification } from '@/app/lib/email/triggerNotification';

interface CommentsSectionExtendedProps extends CommentsSectionProps {
     teamMembers: User[];
     boardId?: string;
     boardName?: string;
     taskTitle?: string;
}

const CommentsSection = ({ taskId, comments, currentUser, task, onRefreshComments, onImagePreview, teamMembers, boardId, boardName, taskTitle }: CommentsSectionExtendedProps) => {
     const { t } = useTranslation();
     const [addNotification] = useAddNotificationMutation();

     const addComment = async (content: string, parentId?: string) => {
          if (!content.trim() || !taskId) return;

          try {
               const { error } = await supabase.from('task_comments').insert({
                    task_id: taskId,
                    user_id: currentUser.id,
                    content: content.trim(),
                    parent_id: parentId || null,
               });

               if (error) throw error;

               // Trigger mention notifications
               const mentionedIds = extractMentionedUserIds(content, teamMembers);
               const currentUserName = currentUser.custom_name || currentUser.name || t('common.unknown');
               const title = taskTitle || task?.title || 'zadanie';

               for (const mentionedId of mentionedIds) {
                    if (mentionedId === currentUser.id) continue;

                    addNotification({
                         user_id: mentionedId,
                         type: 'mention',
                         task_id: taskId,
                         board_id: boardId,
                         message: t('comments.mentionInComment', { name: currentUserName, title }),
                    });

                    if (boardId) {
                         triggerEmailNotification({
                              type: 'mention',
                              taskId,
                              taskTitle: title,
                              boardId,
                              boardName,
                              recipientId: mentionedId,
                              metadata: {
                                   mentionerName: currentUserName,
                                   commentPreview: content.substring(0, 100),
                              },
                         });
                    }
               }

               await onRefreshComments();
               toast.success(parentId ? t('comments.replyAdded') : t('comments.added'));
          } catch (error) {
               console.error('Error adding comment:', error);
               toast.error(t('comments.addFailed'));
          }
     };

     const deleteComment = async (commentId: string) => {
          try {
               const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
               if (error) throw error;
               await onRefreshComments();
               toast.success(t('comments.deleted'));
          } catch (error) {
               console.error('Error deleting comment:', error);
               toast.error(t('comments.deleteFailed'));
          }
     };

     return (
          <div className="border-t border-gray-600 pt-6">
               {currentUser && task && (
                    <>
                         <CommentForm currentUser={currentUser} taskId={taskId} onAddComment={addComment} teamMembers={teamMembers} />
                         <CommentList
                              comments={comments}
                              currentUser={currentUser}
                              task={task}
                              onDeleteComment={deleteComment}
                              onImagePreview={onImagePreview}
                              onAddComment={addComment}
                              teamMembers={teamMembers}
                         />
                    </>
               )}
          </div>
     );
};

export default CommentsSection;

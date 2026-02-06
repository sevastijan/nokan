import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
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
               const currentUserName = currentUser.custom_name || currentUser.name || 'Ktoś';
               const title = taskTitle || task?.title || 'zadanie';

               for (const mentionedId of mentionedIds) {
                    if (mentionedId === currentUser.id) continue;

                    addNotification({
                         user_id: mentionedId,
                         type: 'mention',
                         task_id: taskId,
                         board_id: boardId,
                         message: `${currentUserName} wspomniał(a) Cię w komentarzu do zadania "${title}"`,
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
               toast.success(parentId ? 'Odpowiedź dodana' : 'Komentarz dodany');
          } catch (error) {
               console.error('Błąd dodawania komentarza:', error);
               toast.error('Nie udało się dodać komentarza');
          }
     };

     const deleteComment = async (commentId: string) => {
          try {
               const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
               if (error) throw error;
               await onRefreshComments();
               toast.success('Komentarz usunięty');
          } catch (error) {
               console.error('Błąd usuwania:', error);
               toast.error('Nie udało się usunąć komentarza');
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

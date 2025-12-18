import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/app/types/globalTypes';
import { supabase } from '@/app/lib/supabase';

interface UseTaskCommentsResult {
     comments: Comment[];
     fetchComments: () => Promise<void>;
}

export const useTaskComments = (taskId?: string): UseTaskCommentsResult => {
     const [comments, setComments] = useState<Comment[]>([]);

     const fetchComments = useCallback(async () => {
          if (!taskId) {
               setComments([]);
               return;
          }

          try {
               const { data: commentsData, error: commentsError } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });

               if (commentsError) throw commentsError;

               const commentsWithAuthors = await Promise.all(
                    (commentsData || []).map(async (comment) => {
                         // API comments have source='api' and author_email instead of user_id
                         if (comment.source === 'api') {
                              return {
                                   ...comment,
                                   author: {
                                        id: 'api',
                                        name: comment.author_email || 'API',
                                        email: comment.author_email || null,
                                        image: null,
                                   },
                              };
                         }
                         if (comment.user_id) {
                              const { data: authorData } = await supabase.from('users').select('id, name, email, image').eq('id', comment.user_id).single();

                              return {
                                   ...comment,
                                   author: authorData || null,
                              };
                         }
                         return {
                              ...comment,
                              author: null,
                         };
                    }),
               );

               setComments(commentsWithAuthors);
          } catch (error) {
               console.error('Error fetching comments:', error);
               setComments([]);
          }
     }, [taskId]);

     useEffect(() => {
          fetchComments();
     }, [fetchComments]);

     return { comments, fetchComments };
};

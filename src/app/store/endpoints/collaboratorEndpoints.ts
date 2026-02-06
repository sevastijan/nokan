import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { User } from '@/app/types/globalTypes';

interface RawUserData {
     id: string;
     name: string;
     email: string;
     image?: string;
     custom_name?: string;
     custom_image?: string;
}

interface RawCollaborator {
     id: string;
     task_id: string;
     user_id: string;
     created_at?: string;
     user?: RawUserData | RawUserData[];
}

export const collaboratorEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getTaskCollaborators: builder.query<User[], string>({
          async queryFn(taskId) {
               try {
                    const { data, error } = await getSupabase()
                         .from('task_collaborators')
                         .select(
                              `
                              id,
                              task_id,
                              user_id,
                              created_at,
                              user:users!task_collaborators_user_id_fkey(id, name, email, image, custom_name, custom_image)
                         `,
                         )
                         .eq('task_id', taskId);

                    if (error) throw error;

                    const collaborators: User[] = (data || []).map((c: RawCollaborator) => {
                         const userData = Array.isArray(c.user) ? c.user[0] : c.user;
                         return {
                              id: userData?.id || c.user_id,
                              name: userData?.name || '',
                              email: userData?.email || '',
                              image: userData?.image,
                              custom_name: userData?.custom_name,
                              custom_image: userData?.custom_image,
                         };
                    });

                    return { data: collaborators };
               } catch (err) {
                    const error = err as Error;
                    console.error('[getTaskCollaborators] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, taskId) => [{ type: 'TaskCollaborators' as const, id: taskId }],
     }),

     addTaskCollaborator: builder.mutation<{ taskId: string; userId: string }, { taskId: string; userId: string }>({
          async queryFn({ taskId, userId }) {
               try {
                    const { error } = await getSupabase().from('task_collaborators').insert({
                         task_id: taskId,
                         user_id: userId,
                    });

                    if (error) {
                         // Ignore duplicate error (user already a collaborator)
                         if (error.code === '23505') {
                              return { data: { taskId, userId } };
                         }
                         throw error;
                    }

                    return { data: { taskId, userId } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[addTaskCollaborator] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId }) => [
               { type: 'TaskCollaborators' as const, id: taskId },
               { type: 'Task', id: taskId },
          ],
     }),

     removeTaskCollaborator: builder.mutation<{ taskId: string; userId: string }, { taskId: string; userId: string }>({
          async queryFn({ taskId, userId }) {
               try {
                    const { error } = await getSupabase().from('task_collaborators').delete().eq('task_id', taskId).eq('user_id', userId);

                    if (error) throw error;

                    return { data: { taskId, userId } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[removeTaskCollaborator] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId }) => [
               { type: 'TaskCollaborators' as const, id: taskId },
               { type: 'Task', id: taskId },
          ],
     }),

     updateTaskCollaborators: builder.mutation<{ taskId: string; collaboratorIds: string[]; boardId?: string }, { taskId: string; collaboratorIds: string[]; boardId?: string }>({
          async queryFn({ taskId, collaboratorIds }) {
               try {
                    // Get current collaborators
                    const { data: currentCollabs, error: fetchError } = await getSupabase().from('task_collaborators').select('user_id').eq('task_id', taskId);

                    if (fetchError) throw fetchError;

                    const currentIds = (currentCollabs || []).map((c) => c.user_id);
                    const toAdd = collaboratorIds.filter((id) => !currentIds.includes(id));
                    const toRemove = currentIds.filter((id) => !collaboratorIds.includes(id));

                    // Remove old collaborators
                    if (toRemove.length > 0) {
                         const { error: deleteError } = await getSupabase().from('task_collaborators').delete().eq('task_id', taskId).in('user_id', toRemove);

                         if (deleteError) throw deleteError;
                    }

                    // Add new collaborators
                    if (toAdd.length > 0) {
                         const insertData = toAdd.map((userId) => ({
                              task_id: taskId,
                              user_id: userId,
                         }));

                         const { error: insertError } = await getSupabase().from('task_collaborators').insert(insertData);

                         if (insertError) throw insertError;
                    }

                    return { data: { taskId, collaboratorIds } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[updateTaskCollaborators] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId, boardId }) => {
               const tags: Array<{ type: string; id: string }> = [
                    { type: 'TaskCollaborators', id: taskId },
                    { type: 'Task', id: taskId },
               ];
               if (boardId) {
                    tags.push({ type: 'Board', id: boardId });
               }
               return tags;
          },
     }),
});

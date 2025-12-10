import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { ClientSubmission, Status } from '@/app/types/globalTypes';

export const submissionEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     createSubmission: builder.mutation<
          ClientSubmission,
          {
               title: string;
               description: string;
               priority: string;
               client_id: string;
               board_id: string;
          }
     >({
          async queryFn({ title, description, priority, client_id, board_id }) {
               try {
                    const { data: columns } = await getSupabase().from('columns').select('id').eq('board_id', board_id).order('order', { ascending: true }).limit(1);
                    if (!columns || columns.length === 0) throw new Error('No columns found on this board');
                    const column_id = columns[0].id;
                    const { data: defaultStatuses } = await getSupabase().from('statuses').select('id').eq('board_id', board_id).order('order_index', { ascending: true }).limit(1);
                    const defaultStatusId = defaultStatuses?.[0]?.id ?? null;
                    const { data: task, error: taskErr } = await getSupabase()
                         .from('tasks')
                         .insert({ title, description, priority, board_id, column_id, user_id: client_id, completed: false, sort_order: 0, status_id: defaultStatusId })
                         .select('*')
                         .single();
                    if (taskErr || !task) throw taskErr || new Error('Failed to create task');
                    const { data: submission, error: subErr } = await getSupabase()
                         .from('submissions')
                         .insert({ title, description, priority, client_id, board_id, column_id, task_id: task.id, status: 'pending' })
                         .select('*')
                         .single();
                    if (subErr || !submission) throw subErr || new Error('Failed to create submission');

                    const { data: boards } = await getSupabase().from('boards').select('id, title');
                    const boardTitle = boards?.find((b) => b.id === task.board_id)?.title ?? 'Nieznany board';

                    const result: ClientSubmission = {
                         id: task.id,
                         title: task.title,
                         description: task.description,
                         column_id: task.column_id,
                         board_id: task.board_id,
                         board_title: boardTitle,
                         priority: task.priority,
                         user_id: task.user_id,
                         order: task.sort_order ?? 0,
                         sort_order: task.sort_order ?? 0,
                         completed: task.completed,
                         created_at: task.created_at,
                         updated_at: task.updated_at,
                         submission_id: submission.id,
                         status: null,
                    };
                    return { data: result };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.createSubmission] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: [{ type: 'Submission', id: 'LIST' }],
     }),

     getAllSubmissions: builder.query<ClientSubmission[], void>({
          async queryFn() {
               try {
                    const { data: submissions } = await getSupabase()
                         .from('submissions')
                         .select(
                              `
                        *,
                        task:tasks!submissions_task_id_fkey(*),
                        client:users!submissions_client_id_fkey(id,name,email,image)
                    `,
                         )
                         .order('created_at', { ascending: false });

                    if (!submissions) return { data: [] };

                    const { data: boards } = await getSupabase().from('boards').select('id, title');

                    const mapped: ClientSubmission[] = submissions.map((s) => {
                         const task = Array.isArray(s.task) ? s.task[0] : s.task;
                         const client = Array.isArray(s.client) ? s.client[0] : s.client;
                         const boardTitle = boards?.find((b) => b.id === (task?.board_id || s.board_id))?.title ?? 'Nieznany board';

                         return {
                              id: task?.id || s.task_id || '',
                              title: s.title,
                              description: s.description || '',
                              column_id: s.column_id,
                              board_id: s.board_id,
                              board_title: boardTitle,
                              priority: s.priority,
                              user_id: s.client_id,
                              order: task?.sort_order ?? 0,
                              sort_order: task?.sort_order ?? 0,
                              completed: task?.completed ?? false,
                              created_at: task?.created_at || s.created_at,
                              updated_at: task?.updated_at || s.updated_at,
                              submission_id: s.id,
                              client_name: client?.name || '',
                              client_email: client?.email || '',
                              status: null,
                         };
                    });
                    return { data: mapped };
               } catch (err) {
                    const error = err as Error;
                    console.error('[getAllSubmissionsQuery] exception:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => {
               if (!result) return [{ type: 'Submission', id: 'LIST' }];
               return [...result.map((s) => ({ type: 'Submission' as const, id: s.submission_id })), { type: 'Submission', id: 'LIST' }];
          },
     }),

     getClientSubmissions: builder.query<ClientSubmission[], string>({
          async queryFn(clientId) {
               try {
                    const { data: submissions } = await getSupabase()
                         .from('submissions')
                         .select(
                              `
                        *,
                        task:tasks!submissions_task_id_fkey(*),
                        client:users!submissions_client_id_fkey(id, name, email, image),
                        status_obj:statuses!tasks_status_id_fkey(id, label, color)
                    `,
                         )
                         .eq('client_id', clientId)
                         .order('created_at', { ascending: false });

                    if (!submissions || submissions.length === 0) return { data: [] };

                    const { data: boards } = await getSupabase().from('boards').select('id, title');

                    const mapped: ClientSubmission[] = submissions.map((s) => {
                         const task = Array.isArray(s.task) && s.task.length > 0 ? s.task[0] : null;
                         const client = Array.isArray(s.client) && s.client.length > 0 ? s.client[0] : null;
                         const statusObj = Array.isArray(s.status_obj) && s.status_obj.length > 0 ? s.status_obj[0] : null;
                         const status: Status | null = statusObj ? { id: statusObj.id, label: statusObj.label, color: statusObj.color } : null;
                         const boardTitle = boards?.find((b) => b.id === (task?.board_id || s.board_id))?.title ?? 'Nieznany board';

                         return {
                              id: task?.id || s.task_id || '',
                              title: s.title,
                              description: s.description || '',
                              column_id: task?.column_id || s.column_id,
                              board_id: task?.board_id || s.board_id,
                              board_title: boardTitle,
                              priority: task?.priority || s.priority || 'low',
                              user_id: task?.user_id || s.client_id,
                              order: task?.sort_order ?? 0,
                              sort_order: task?.sort_order ?? 0,
                              completed: task?.completed ?? false,
                              created_at: task?.created_at || s.created_at,
                              updated_at: task?.updated_at || s.updated_at,
                              submission_id: s.id,
                              client_name: client?.name || 'Nieznany',
                              client_email: client?.email || 'Nieznany',
                              status,
                         };
                    });
                    return { data: mapped };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getClientSubmissions] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) =>
               result ? [...result.map((s) => ({ type: 'Submission' as const, id: s.submission_id })), { type: 'Submission', id: 'LIST' }] : [{ type: 'Submission', id: 'LIST' }],
     }),

     updateSubmission: builder.mutation<ClientSubmission, { submissionId: string; taskId: string; data: { title?: string; description?: string; priority?: string } }>({
          async queryFn({ submissionId, taskId, data }) {
               try {
                    await getSupabase().from('tasks').update(data).eq('id', taskId);
                    const { data: submission } = await getSupabase().from('submissions').update(data).eq('id', submissionId).select('*').single();
                    const { data: task } = await getSupabase().from('tasks').select('*').eq('id', taskId).single();
                    const { data: boards } = await getSupabase().from('boards').select('id, title');
                    const boardTitle = boards?.find((b) => b.id === task.board_id)?.title ?? 'Nieznany board';
                    const result: ClientSubmission = {
                         id: task.id,
                         title: task.title,
                         description: task.description,
                         column_id: task.column_id,
                         board_id: task.board_id,
                         board_title: boardTitle,
                         priority: task.priority,
                         user_id: task.user_id,
                         order: task.sort_order ?? 0,
                         sort_order: task.sort_order ?? 0,
                         completed: task.completed,
                         created_at: task.created_at,
                         updated_at: task.updated_at,
                         submission_id: submission.id,
                         status: null,
                    };
                    return { data: result };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateSubmission] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { submissionId }) => [
               { type: 'Submission', id: submissionId },
               { type: 'Submission', id: 'LIST' },
          ],
     }),

     deleteSubmission: builder.mutation<void, { submissionId: string; taskId: string }>({
          async queryFn({ submissionId, taskId }) {
               try {
                    await getSupabase().from('submissions').delete().eq('id', submissionId);
                    await getSupabase().from('tasks').delete().eq('id', taskId);
                    return { data: undefined };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.deleteSubmission] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: [{ type: 'Submission', id: 'LIST' }],
     }),
});

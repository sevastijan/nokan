import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { supabase } from '@/app/lib/supabase';
import { ClientSubmission } from '@/app/types/globalTypes';

interface RawSubmission {
     id: string;
     title: string;
     description: string;
     priority: string;
     client_id: string;
     board_id: string;
     column_id: string;
     status: string;
     task_id?: string;
     created_at?: string;
     updated_at?: string;
     task?: unknown;
     client?: unknown;
}

interface RawUser {
     id: string;
     name: string;
     email: string;
     image?: string;
}

export const submissionEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     // Utworzenie zgłoszenia przez klienta
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
                    // Znajdź pierwszą kolumnę na boardzie (domyślnie "To Do" lub pierwsza dostępna)
                    const { data: columns, error: colErr } = await supabase.from('columns').select('id').eq('board_id', board_id).order('order', { ascending: true }).limit(1);

                    if (colErr || !columns || columns.length === 0) {
                         throw new Error('No columns found on this board');
                    }

                    const column_id = columns[0].id;

                    // Utwórz zadanie
                    const { data: task, error: taskErr } = await supabase
                         .from('tasks')
                         .insert({
                              title,
                              description,
                              priority,
                              board_id,
                              column_id,
                              user_id: client_id,
                              completed: false,
                              sort_order: 0,
                              status: 'pending',
                         })
                         .select('*')
                         .single();

                    if (taskErr || !task) throw taskErr || new Error('Failed to create task');

                    // Utwórz wpis zgłoszenia
                    const { data: submission, error: subErr } = await supabase
                         .from('submissions')
                         .insert({
                              title,
                              description,
                              priority,
                              client_id,
                              board_id,
                              column_id,
                              task_id: task.id,
                              status: 'pending',
                         })
                         .select('*')
                         .single();

                    if (subErr || !submission) throw subErr || new Error('Failed to create submission');

                    const result: ClientSubmission = {
                         id: task.id,
                         title: task.title,
                         description: task.description,
                         column_id: task.column_id,
                         board_id: task.board_id,
                         priority: task.priority,
                         user_id: task.user_id,
                         order: task.sort_order ?? 0,
                         sort_order: task.sort_order ?? 0,
                         completed: task.completed,
                         created_at: task.created_at,
                         updated_at: task.updated_at,
                         status: task.status,
                         submission_id: submission.id,
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

     // Pobierz zgłoszenia klienta
     getClientSubmissions: builder.query<ClientSubmission[], string>({
          async queryFn(clientId) {
               try {
                    const { data: submissions, error: subErr } = await supabase
                         .from('submissions')
                         .select(
                              `
            *,
            task:tasks!submissions_task_id_fkey(*),
            client:users!submissions_client_id_fkey(id, name, email, image)
          `,
                         )
                         .eq('client_id', clientId)
                         .order('created_at', { ascending: false });

                    if (subErr) throw subErr;

                    const mapped: ClientSubmission[] = ((submissions as RawSubmission[]) || []).map((s) => {
                         const taskData = Array.isArray(s.task) ? s.task[0] : s.task;
                         const clientData = Array.isArray(s.client) ? s.client[0] : s.client;

                         const client = clientData as RawUser | undefined;

                         return {
                              id: s.task_id || s.id,
                              title: s.title,
                              description: s.description,
                              column_id: s.column_id,
                              board_id: s.board_id,
                              priority: s.priority,
                              user_id: s.client_id,
                              order: 0,
                              sort_order: 0,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              completed: taskData ? (taskData as any).completed : false,
                              status: s.status,
                              created_at: s.created_at,
                              updated_at: s.updated_at,
                              submission_id: s.id,
                              client_name: client?.name,
                              client_email: client?.email,
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

     // Aktualizacja zgłoszenia przez klienta
     updateSubmission: builder.mutation<
          ClientSubmission,
          {
               submissionId: string;
               taskId: string;
               data: {
                    title?: string;
                    description?: string;
                    priority?: string;
                    status?: string;
               };
          }
     >({
          async queryFn({ submissionId, taskId, data }) {
               try {
                    // Aktualizuj zadanie
                    const { error: taskErr } = await supabase.from('tasks').update(data).eq('id', taskId);

                    if (taskErr) throw taskErr;

                    // Aktualizuj zgłoszenie
                    const { data: submission, error: subErr } = await supabase.from('submissions').update(data).eq('id', submissionId).select('*').single();

                    if (subErr || !submission) throw subErr || new Error('Failed to update submission');

                    // Pobierz zaktualizowane zadanie
                    const { data: task, error: getTaskErr } = await supabase.from('tasks').select('*').eq('id', taskId).single();

                    if (getTaskErr || !task) throw getTaskErr || new Error('Failed to fetch updated task');

                    const result: ClientSubmission = {
                         id: task.id,
                         title: task.title,
                         description: task.description,
                         column_id: task.column_id,
                         board_id: task.board_id,
                         priority: task.priority,
                         user_id: task.user_id,
                         order: task.sort_order ?? 0,
                         sort_order: task.sort_order ?? 0,
                         completed: task.completed,
                         status: task.status,
                         created_at: task.created_at,
                         updated_at: task.updated_at,
                         submission_id: submission.id,
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

     // Usuń zgłoszenie
     deleteSubmission: builder.mutation<void, { submissionId: string; taskId: string }>({
          async queryFn({ submissionId, taskId }) {
               try {
                    // Usuń zgłoszenie
                    const { error: subErr } = await supabase.from('submissions').delete().eq('id', submissionId);

                    if (subErr) throw subErr;

                    // Usuń zadanie
                    const { error: taskErr } = await supabase.from('tasks').delete().eq('id', taskId);

                    if (taskErr) throw taskErr;

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

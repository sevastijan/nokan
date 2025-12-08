import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { supabase } from '@/app/lib/supabase';
import { Task, TaskDetail, Attachment, User } from '@/app/types/globalTypes';

interface RawTask {
     id: string;
     title: string;
     description: string;
     column_id: string;
     board_id: string;
     priority?: string;
     user_id?: string;
     sort_order?: number;
     completed: boolean;
     created_at?: string;
     updated_at?: string;
     images?: string;
     start_date?: string;
     end_date?: string;
     due_date?: string;
     status?: string;
     assignee?: unknown;
     attachments?: unknown[];
     comments?: unknown[];
     priority_data?: unknown;
}

interface RawUser {
     id: string;
     name: string;
     email: string;
     image?: string;
     role?: string;
     created_at?: string;
}

interface RawComment {
     id: string;
     task_id: string;
     user_id: string;
     content: string;
     created_at: string;
     updated_at?: string;
     author?: unknown;
}

interface RawAttachment {
     id: string;
     task_id: string;
     file_name: string;
     file_path: string;
     file_size: number;
     mime_type: string;
     uploaded_by: string;
     created_at: string;
}

interface RawPriority {
     id: string;
     label: string;
     color: string;
}

export const taskEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     addTask: builder.mutation<Task, Partial<TaskDetail> & { column_id: string }>({
          async queryFn({ column_id, ...rest }) {
               try {
                    const payload = {
                         ...rest,
                         column_id,
                         completed: false,
                         sort_order: 0,
                    };
                    const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
                    if (error || !data) throw error || new Error('Add task failed');
                    const mapped: Task = {
                         id: data.id,
                         title: data.title,
                         description: data.description,
                         column_id: data.column_id,
                         board_id: data.board_id,
                         priority: data.priority,
                         user_id: data.user_id,
                         order: data.sort_order ?? 0,
                         sort_order: data.sort_order ?? 0,
                         completed: data.completed,
                         created_at: data.created_at,
                         updated_at: data.updated_at,
                         images: data.images,
                         assignee: undefined,
                         start_date: data.start_date,
                         end_date: data.end_date,
                         due_date: data.due_date,
                         status: data.status,
                    };
                    return { data: mapped };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.addTask] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { column_id }) => [{ type: 'Column', id: column_id }],
     }),

     addStarterTask: builder.mutation<
          Task,
          {
               templateTaskId: string;
               boardId: string;
               columnId: string;
               order: number;
          }
     >({
          async queryFn({ templateTaskId, boardId, columnId, order }) {
               try {
                    const { data: templateTask, error } = await supabase.from('template_tasks').select('*').eq('id', templateTaskId).single();
                    if (error || !templateTask) {
                         throw error || new Error('Template task not found');
                    }

                    const insertPayload = {
                         title: templateTask.title,
                         description: templateTask.description,
                         priority: templateTask.priority,
                         board_id: boardId,
                         column_id: columnId,
                         sort_order: order,
                         completed: false,
                    };
                    const { data: newTask, error: insertErr } = await supabase.from('tasks').insert(insertPayload).select('*').single();
                    if (insertErr || !newTask) {
                         throw insertErr || new Error('Insert failed');
                    }

                    const mapped: Task = {
                         id: newTask.id,
                         title: newTask.title,
                         description: newTask.description ?? '',
                         column_id: newTask.column_id,
                         board_id: newTask.board_id,
                         priority: newTask.priority ?? '',
                         user_id: newTask.user_id,
                         order: newTask.sort_order ?? 0,
                         sort_order: newTask.sort_order ?? 0,
                         completed: newTask.completed,
                         created_at: newTask.created_at,
                         updated_at: newTask.updated_at,
                         images: newTask.images,
                         assignee: undefined,
                         start_date: newTask.start_date,
                         end_date: newTask.end_date,
                         due_date: newTask.due_date,
                         status: newTask.status,
                    };
                    return { data: mapped };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_res, _err, { columnId }) => [{ type: 'Column', id: columnId }],
     }),

     getTaskById: builder.query<TaskDetail, { taskId: string }>({
          async queryFn({ taskId }) {
               try {
                    const { data: taskData, error: te } = await supabase
                         .from('tasks')
                         .select(
                              `
             *,
             attachments:task_attachments!task_attachments_task_id_fkey(*),
             comments:task_comments!task_comments_task_id_fkey(
               *,
               author:users!task_comments_user_id_fkey(id,name,email,image)
             ),
             assignee:users!tasks_user_id_fkey(id,name,email,image,role,created_at),
             priority_data:priorities!tasks_priority_fkey(id,label,color)
            `,
                         )
                         .eq('id', taskId)
                         .single();
                    if (te || !taskData) throw te || new Error('Task not found');

                    const rawTask = taskData as RawTask;
                    let assignee: User | null = null;
                    if (Array.isArray(rawTask.assignee) && rawTask.assignee.length > 0) {
                         const u = rawTask.assignee[0] as RawUser;
                         assignee = {
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              image: u.image,
                              role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                              created_at: u.created_at,
                         };
                    } else if (rawTask.assignee) {
                         const u = rawTask.assignee as RawUser;
                         assignee = {
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              image: u.image,
                              role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                              created_at: u.created_at,
                         };
                    }

                    let priority_info: {
                         id: string;
                         label: string;
                         color: string;
                    } | null = null;
                    if (Array.isArray(rawTask.priority_data) && rawTask.priority_data.length > 0) {
                         const p = rawTask.priority_data[0] as RawPriority;
                         priority_info = { id: p.id, label: p.label, color: p.color };
                    } else if (rawTask.priority_data) {
                         const p = rawTask.priority_data as RawPriority;
                         priority_info = { id: p.id, label: p.label, color: p.color };
                    }

                    let attachments: Attachment[] = [];
                    if (Array.isArray(rawTask.attachments)) {
                         attachments = (rawTask.attachments as RawAttachment[]).map((a) => ({
                              id: a.id,
                              task_id: a.task_id,
                              file_name: a.file_name,
                              file_path: a.file_path,
                              file_size: a.file_size,
                              mime_type: a.mime_type,
                              uploaded_by: a.uploaded_by,
                              created_at: a.created_at,
                         }));
                    }

                    let comments: TaskDetail['comments'] = [];
                    if (Array.isArray(rawTask.comments)) {
                         comments = (rawTask.comments as RawComment[]).map((c) => {
                              let authorObj: RawUser | null = null;
                              if (Array.isArray(c.author) && c.author.length > 0) {
                                   authorObj = c.author[0] as RawUser;
                              } else if (c.author) {
                                   authorObj = c.author as RawUser;
                              }
                              const author = authorObj
                                   ? {
                                          id: authorObj.id,
                                          name: authorObj.name,
                                          email: authorObj.email,
                                          image: authorObj.image,
                                     }
                                   : {
                                          id: '',
                                          name: '',
                                          email: '',
                                          image: undefined,
                                     };
                              return {
                                   id: c.id,
                                   task_id: c.task_id,
                                   user_id: c.user_id,
                                   content: c.content,
                                   created_at: c.created_at,
                                   updated_at: c.updated_at,
                                   author,
                              };
                         });
                    }

                    const result: TaskDetail = {
                         id: rawTask.id,
                         title: rawTask.title,
                         description: rawTask.description,
                         column_id: rawTask.column_id,
                         board_id: rawTask.board_id,
                         priority: rawTask.priority ?? null,
                         user_id: rawTask.user_id ?? null,
                         order: rawTask.sort_order ?? 0,
                         completed: rawTask.completed,
                         created_at: rawTask.created_at ?? null,
                         updated_at: rawTask.updated_at ?? null,
                         images: rawTask.images ? JSON.parse(rawTask.images) : null,
                         assignee,
                         start_date: rawTask.start_date ?? null,
                         end_date: rawTask.end_date ?? null,
                         due_date: rawTask.due_date ?? null,
                         status: rawTask.status ?? null,
                         priority_info,
                         attachments,
                         comments,
                         imagePreview: null,
                         hasUnsavedChanges: false,
                    };

                    return { data: result };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getTaskById] error:', error);
                    return {
                         error: { status: 'CUSTOM_ERROR', error: error.message },
                    };
               }
          },
          providesTags: (_result, _error, { taskId }) => [{ type: 'Task', id: taskId }],
     }),

     getTasksWithDates: builder.query<Task[], string>({
          async queryFn(boardId) {
               try {
                    const { data: rawTasks = [], error } = await supabase
                         .from('tasks')
                         .select(
                              `
              id,
              title,
              description,
              start_date,
              end_date,
              due_date,
              completed,
              user_id,
              priority,
              column_id,
              board_id,
              sort_order,
              status,
              users (
                id,
                name,
                email,
                image
              )
            `,
                         )
                         .eq('board_id', boardId);

                    if (error) throw error;

                    const tasks: Task[] = (rawTasks as RawTask[]).map((t) => {
                         const assigneeObj: User | undefined = (t as unknown as { users: RawUser }).users
                              ? {
                                     id: (t as unknown as { users: RawUser }).users.id,
                                     name: (t as unknown as { users: RawUser }).users.name,
                                     email: (t as unknown as { users: RawUser }).users.email,
                                     image: (t as unknown as { users: RawUser }).users.image,
                                }
                              : undefined;

                         return {
                              id: t.id,
                              title: t.title,
                              description: t.description ?? '',
                              column_id: t.column_id,
                              board_id: t.board_id,
                              priority: t.priority ?? '',
                              user_id: t.user_id,
                              order: t.sort_order ?? 0,
                              sort_order: t.sort_order ?? 0,
                              completed: t.completed,
                              created_at: t.created_at,
                              updated_at: t.updated_at,
                              assignee: assigneeObj,
                              start_date: t.start_date,
                              end_date: t.end_date,
                              due_date: t.due_date,
                              status: t.status,
                         };
                    });

                    const filtered = tasks.filter((tk) => tk.start_date || tk.end_date || tk.due_date);

                    return { data: filtered };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getTasksWithDates] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => (result ? result.map((t) => ({ type: 'TasksWithDates' as const, id: t.id })) : []),
     }),

     getTasksByBoardsAndDate: builder.query<Task[], { boardIds: string[]; start: string; end: string }>({
          async queryFn(arg) {
               const { boardIds, start, end } = arg;
               if (!boardIds || boardIds.length === 0) {
                    return { data: [] };
               }
               try {
                    const { data, error } = await supabase
                         .from('tasks')
                         .select('id,title,description,start_date,end_date,board_id,priority,color,column_id,sort_order,completed,status')
                         .in('board_id', boardIds)
                         .gte('start_date', start)
                         .lte('start_date', end);
                    if (error) {
                         console.error('getTasksByBoardsAndDate error:', error.message);
                         return { error: { status: 'CUSTOM_ERROR', error: error.message } };
                    }
                    const tasks: Task[] = (data || []).map((t: RawTask) => ({
                         id: t.id,
                         title: t.title,
                         description: t.description ?? '',
                         start_date: t.start_date,
                         end_date: t.end_date,
                         board_id: t.board_id,
                         priority: t.priority ?? '',
                         column_id: t.column_id,
                         sort_order: t.sort_order ?? 0,
                         order: t.sort_order ?? 0,
                         completed: t.completed,
                         status: t.status,
                    }));
                    return { data: tasks };
               } catch (err) {
                    const error = err as Error;
                    console.error('getTasksByBoardsAndDate unexpected:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => (result ? [...result.map(({ id }) => ({ type: 'Tasks' as const, id })), { type: 'Tasks', id: 'LIST' }] : [{ type: 'Tasks', id: 'LIST' }]),
     }),

     removeTask: builder.mutation<{ id: string; columnId: string }, { taskId: string; columnId: string }>({
          async queryFn({ taskId, columnId }) {
               try {
                    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
                    if (error) throw error;
                    return { data: { id: taskId, columnId } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.removeTask] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { columnId }) => [{ type: 'Column', id: columnId }],
     }),

     updateTask: builder.mutation<Task, { taskId: string; data: Partial<TaskDetail> }>({
          async queryFn({ taskId, data }) {
               try {
                    const dbPayload: Record<string, unknown> = { ...data };
                    if ('order' in dbPayload && dbPayload.order !== undefined) {
                         dbPayload.sort_order = dbPayload.order;
                         delete dbPayload.order;
                    }
                    const { data: updated, error } = await supabase.from('tasks').update(dbPayload).eq('id', taskId).select('*').single();
                    if (error || !updated) throw error || new Error('Update failed');
                    const mapped: Task = {
                         id: updated.id,
                         title: updated.title,
                         description: updated.description,
                         column_id: updated.column_id,
                         board_id: updated.board_id,
                         priority: updated.priority,
                         user_id: updated.user_id,
                         order: updated.sort_order ?? 0,
                         sort_order: updated.sort_order ?? 0,
                         completed: updated.completed,
                         created_at: updated.created_at,
                         updated_at: updated.updated_at,
                         images: updated.images,
                         assignee: undefined,
                         start_date: updated.start_date,
                         end_date: updated.end_date,
                         due_date: updated.due_date,
                         status: updated.status,
                    };
                    return { data: mapped };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateTask] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId, data }) => {
               const tags: Array<{ type: string; id: string }> = [{ type: 'Task', id: taskId }];
               if (data.column_id) {
                    tags.push({ type: 'Column', id: data.column_id });
               }
               if (data.start_date || data.end_date) {
                    tags.push({ type: 'TasksWithDates', id: taskId });
               }
               return tags;
          },
     }),

     updateTaskCompletion: builder.mutation<void, { taskId: string; completed: boolean }>({
          async queryFn({ taskId, completed }) {
               try {
                    const { error } = await supabase.from('tasks').update({ completed }).eq('id', taskId);
                    if (error) throw error;
                    return { data: undefined };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateTaskCompletion] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Task', id: taskId }],
     }),

     updateTaskDates: builder.mutation<void, { taskId: string; start_date: string | null; end_date: string | null }>({
          async queryFn({ taskId, start_date, end_date }) {
               try {
                    const { error } = await supabase.from('tasks').update({ start_date, end_date }).eq('id', taskId);
                    if (error) throw error;
                    return { data: undefined };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateTaskDates] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId }) => [
               { type: 'Task', id: taskId },
               { type: 'TasksWithDates', id: taskId },
          ],
     }),
     uploadAttachment: builder.mutation<Attachment, { file: File; taskId: string; userId: string }>({
          async queryFn({ file, taskId, userId }) {
               try {
                    const fileExt = file.name.split('.').pop();
                    const filePath = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { error: upErr } = await supabase.storage.from('attachments').upload(filePath, file, {
                         upsert: false,
                         contentType: file.type,
                    });

                    if (upErr) throw upErr;

                    const { data, error: dbErr } = await supabase
                         .from('task_attachments')
                         .insert({
                              task_id: taskId,
                              file_name: file.name,
                              file_path: filePath,
                              file_size: file.size,
                              mime_type: file.type,
                              uploaded_by: userId,
                         })
                         .select('*')
                         .single();

                    if (dbErr || !data) throw dbErr || new Error('Attachment insert failed');

                    return { data };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.uploadAttachment] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, arg) => [{ type: 'Task', id: arg.taskId }],
     }),

     getPriorities: builder.query<{ id: string; label: string; color: string }[], void>({
          async queryFn() {
               try {
                    const { data, error } = await supabase.from('priorities').select('id,label,color').order('created_at', { ascending: true }); // ← to działa zawsze

                    if (error) throw error;

                    return { data: data ?? [] };
               } catch (err) {
                    const error = err as Error;
                    console.error('[getPriorities] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: ['Priority'],
     }),
});

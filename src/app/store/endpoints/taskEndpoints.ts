import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { Task, TaskDetail, Attachment, User } from '@/app/types/globalTypes';

interface RawTask {
     id: string;
     title: string;
     description: string;
     column_id: string;
     board_id: string;
     priority?: string;
     user_id?: string;
     created_by?: string;
     sort_order?: number;
     completed: boolean;
     created_at?: string;
     updated_at?: string;
     images?: string;
     start_date?: string;
     end_date?: string;
     due_date?: string;
     status_id?: string;
     creator?: unknown;
     attachments?: unknown[];
     comments?: unknown[];
     priority_data?: unknown;
     collaborators?: unknown[];
     type?: 'task' | 'story';
     parent_id?: string | null;
}

interface RawCollaborator {
     id: string;
     task_id: string;
     user_id: string;
     user?: RawUser[] | RawUser;
}

interface RawUser {
     id: string;
     name: string;
     email: string;
     image?: string;
     role?: string;
     created_at?: string;
     custom_name?: string;
     custom_image?: string;
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
                    const { data, error } = await getSupabase().from('tasks').insert(payload).select('*').single();
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
                         status_id: data.status_id,
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
                    const { data: templateTask, error } = await getSupabase().from('template_tasks').select('*').eq('id', templateTaskId).single();
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
                    const { data: newTask, error: insertErr } = await getSupabase().from('tasks').insert(insertPayload).select('*').single();
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
                         status_id: newTask.status_id,
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
                    const { data: taskData, error: te } = await getSupabase()
                         .from('tasks')
                         .select(
                              `
               *,
               is_recurring,
               recurrence_type,
               recurrence_interval,
               recurrence_column_id,
               next_occurrence_date,
               attachments:task_attachments!task_attachments_task_id_fkey(*),
               comments:task_comments!task_comments_task_id_fkey(
                    id,
                    task_id,
                    user_id,
                    content,
                    created_at,
                    updated_at,
                    parent_id,
                    author:users!task_comments_user_id_fkey(
                         id,
                         name,
                         email,
                         image,
                         custom_name,
                         custom_image
                    )
               ),
               creator:users!tasks_created_by_fkey(id,name,email,image,role,created_at,custom_name,custom_image),
               priority_data:priorities!tasks_priority_fkey(id,label,color),
               collaborators:task_collaborators(
                    id,
                    user_id,
                    user:users!task_collaborators_user_id_fkey(id,name,email,image,custom_name,custom_image)
               )
          `,
                         )
                         .eq('id', taskId)
                         .single();

                    if (te || !taskData) throw te || new Error('Task not found');

                    const rawTask = taskData as RawTask & {
                         is_recurring?: boolean;
                         recurrence_type?: string | null;
                         recurrence_interval?: number | null;
                         recurrence_column_id?: string | null;
                         next_occurrence_date?: string | null;
                    };

                    // === Creator ===
                    let creator: User | null = null;
                    if (Array.isArray(rawTask.creator) && rawTask.creator.length > 0) {
                         const u = rawTask.creator[0] as RawUser;
                         creator = {
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              image: u.image,
                              custom_name: u.custom_name,
                              custom_image: u.custom_image,
                              role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                              created_at: u.created_at,
                         };
                    } else if (rawTask.creator) {
                         const u = rawTask.creator as RawUser;
                         creator = {
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              image: u.image,
                              custom_name: u.custom_name,
                              custom_image: u.custom_image,
                              role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                              created_at: u.created_at,
                         };
                    }

                    // === Priority ===
                    let priority_info: { id: string; label: string; color: string } | null = null;
                    if (Array.isArray(rawTask.priority_data) && rawTask.priority_data.length > 0) {
                         const p = rawTask.priority_data[0] as RawPriority;
                         priority_info = { id: p.id, label: p.label, color: p.color };
                    } else if (rawTask.priority_data) {
                         const p = rawTask.priority_data as RawPriority;
                         priority_info = { id: p.id, label: p.label, color: p.color };
                    }

                    // === Attachments ===
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

                    // === Comments ===
                    let comments: TaskDetail['comments'] = [];
                    if (Array.isArray(rawTask.comments)) {
                         comments = (
                              rawTask.comments as Array<{
                                   id: string;
                                   task_id: string;
                                   user_id: string;
                                   content: string;
                                   created_at: string;
                                   updated_at?: string;
                                   parent_id?: string | null;
                                   author?: RawUser | RawUser[] | null;
                              }>
                         ).map((c) => {
                              let authorObj: RawUser | null = null;

                              if (Array.isArray(c.author) && c.author.length > 0) {
                                   authorObj = c.author[0] as RawUser;
                              } else if (c.author && !Array.isArray(c.author)) {
                                   authorObj = c.author as RawUser;
                              }

                              const author = authorObj
                                   ? {
                                          id: authorObj.id,
                                          name: authorObj.name,
                                          email: authorObj.email,
                                          image: authorObj.image || undefined,
                                          custom_name: authorObj.custom_name,
                                          custom_image: authorObj.custom_image,
                                     }
                                   : {
                                          id: '',
                                          name: 'Nieznany użytkownik',
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
                                   parent_id: c.parent_id || null,
                                   author,
                              };
                         });
                    }

                    let collaborators: User[] = [];
                    if (Array.isArray(rawTask.collaborators)) {
                         collaborators = (rawTask.collaborators as RawCollaborator[])
                              .filter((c) => c.user)
                              .map((c) => {
                                   const u = Array.isArray(c.user) ? c.user[0] : c.user;
                                   return {
                                        id: u?.id || c.user_id,
                                        name: u?.name || '',
                                        email: u?.email || '',
                                        image: u?.image,
                                        custom_name: u?.custom_name,
                                        custom_image: u?.custom_image,
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
                         created_by: rawTask.created_by ?? null,
                         creator,
                         order: rawTask.sort_order ?? 0,
                         completed: rawTask.completed,
                         created_at: rawTask.created_at ?? null,
                         updated_at: rawTask.updated_at ?? null,
                         images: rawTask.images ? JSON.parse(rawTask.images) : null,
                         collaborators,
                         start_date: rawTask.start_date ?? null,
                         end_date: rawTask.end_date ?? null,
                         due_date: rawTask.due_date ?? null,
                         status_id: rawTask.status_id ?? null,
                         priority_info,
                         attachments,
                         comments,
                         imagePreview: null,
                         hasUnsavedChanges: false,
                         is_recurring: rawTask.is_recurring ?? false,
                         recurrence_type: (() => {
                              const type = rawTask.recurrence_type;
                              if (type === 'daily' || type === 'weekly' || type === 'monthly' || type === 'yearly' || type === null) {
                                   return type;
                              }
                              return null;
                         })(),
                         recurrence_interval: rawTask.recurrence_interval ?? null,
                         recurrence_column_id: rawTask.recurrence_column_id ?? null,
                         next_occurrence_date: rawTask.next_occurrence_date ?? null,
                         type: rawTask.type ?? 'task',
                         parent_id: rawTask.parent_id ?? null,
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
                    const { data: rawTasks = [], error } = await getSupabase()
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
              status_id,
              users (
                id,
                name,
                email,
                image,
                custom_name,
                custom_image
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
                                     custom_name: (t as unknown as { users: RawUser }).users.custom_name,
                                     custom_image: (t as unknown as { users: RawUser }).users.custom_image,
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
                              status_id: t.status_id,
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
                    const { data, error } = await getSupabase()
                         .from('tasks')
                         .select('id,title,description,start_date,end_date,board_id,priority,color,column_id,sort_order,completed,status_id')
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
                         status_id: t.status_id,
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
                    const { error } = await getSupabase().from('tasks').delete().eq('id', taskId);
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

                    if ('is_recurring' in data) dbPayload.is_recurring = data.is_recurring;
                    if ('recurrence_type' in data) dbPayload.recurrence_type = data.recurrence_type;
                    if ('recurrence_interval' in data) dbPayload.recurrence_interval = data.recurrence_interval;
                    if ('recurrence_column_id' in data) dbPayload.recurrence_column_id = data.recurrence_column_id;
                    if ('next_occurrence_date' in data) dbPayload.next_occurrence_date = data.next_occurrence_date;

                    const { data: updated, error } = await getSupabase()
                         .from('tasks')
                         .update(dbPayload)
                         .eq('id', taskId)
                         .select(
                              `
                              id,
                              title,
                              description,
                              column_id,
                              board_id,
                              priority,
                              user_id,
                              sort_order,
                              completed,
                              created_at,
                              updated_at,
                              start_date,
                              end_date,
                              due_date,
                              status_id,
                              is_recurring,
                              recurrence_type,
                              recurrence_interval,
                              recurrence_column_id,
                              next_occurrence_date
                         `,
                         )
                         .single();

                    if (error || !updated) {
                         console.error('❌ updateTask mutation failed:', error);
                         throw error || new Error('Update failed');
                    }

                    const mapped: Task = {
                         id: updated.id,
                         title: updated.title,
                         description: updated.description ?? '',
                         column_id: updated.column_id,
                         board_id: updated.board_id,
                         priority: updated.priority ?? '',
                         user_id: updated.user_id ?? null,
                         order: updated.sort_order ?? 0,
                         sort_order: updated.sort_order ?? 0,
                         completed: updated.completed,
                         created_at: updated.created_at,
                         updated_at: updated.updated_at,
                         assignee: undefined,
                         start_date: updated.start_date ?? null,
                         end_date: updated.end_date ?? null,
                         due_date: updated.due_date ?? null,
                         status_id: updated.status_id ?? null,
                         is_recurring: updated.is_recurring ?? false,
                         recurrence_type: updated.recurrence_type ?? null,
                         recurrence_interval: updated.recurrence_interval ?? null,
                         recurrence_column_id: updated.recurrence_column_id ?? null,
                         next_occurrence_date: updated.next_occurrence_date ?? null,
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

               if (data.start_date || data.end_date || data.due_date) {
                    tags.push({ type: 'TasksWithDates', id: taskId });
               }

               if (data.recurrence_column_id) {
                    tags.push({ type: 'Column', id: data.recurrence_column_id });
               }

               return tags;
          },
     }),

     updateTaskCompletion: builder.mutation<void, { taskId: string; completed: boolean }>({
          async queryFn({ taskId, completed }) {
               try {
                    const { error } = await getSupabase().from('tasks').update({ completed }).eq('id', taskId);
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
                    const { error } = await getSupabase().from('tasks').update({ start_date, end_date }).eq('id', taskId);
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

     uploadAttachment: builder.mutation<Attachment, { file: File; taskId: string }>({
          async queryFn({ file, taskId }) {
               try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('taskId', taskId);

                    const response = await fetch('/api/upload', {
                         method: 'POST',
                         body: formData,
                    });

                    if (!response.ok) {
                         const error = await response.json();
                         throw new Error(error.error || 'Upload failed');
                    }

                    const { attachment } = await response.json();

                    if (!attachment) {
                         throw new Error('No attachment returned from API');
                    }

                    return { data: attachment };
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
                    const { data, error } = await getSupabase().from('priorities').select('id,label,color').order('created_at', { ascending: true });

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

     getSubtasks: builder.query<Task[], { storyId: string }>({
          async queryFn({ storyId }) {
               try {
                    const { data, error } = await getSupabase()
                         .from('tasks')
                         .select(
                              `
                              id, title, description, column_id, board_id, priority,
                              user_id, sort_order, completed, created_at, updated_at,
                              type, parent_id,
                              collaborators:task_collaborators(
                                   id, user_id,
                                   user:users!task_collaborators_user_id_fkey(id, name, email, image, custom_name, custom_image)
                              )
                         `,
                         )
                         .eq('parent_id', storyId)
                         .eq('type', 'task')
                         .order('sort_order', { ascending: true });

                    if (error) throw error;

                    const subtasks: Task[] = (data || []).map((t) => {
                         const collaborators: User[] = Array.isArray(t.collaborators)
                              ? (t.collaborators as RawCollaborator[])
                                     .filter((c) => c.user)
                                     .map((c) => {
                                          const u = Array.isArray(c.user) ? c.user[0] : c.user;
                                          return {
                                               id: u?.id || c.user_id,
                                               name: u?.name || '',
                                               email: u?.email || '',
                                               image: u?.image,
                                               custom_name: u?.custom_name,
                                               custom_image: u?.custom_image,
                                          };
                                     })
                              : [];

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
                              type: t.type as 'task' | 'story',
                              parent_id: t.parent_id,
                              collaborators,
                         };
                    });

                    return { data: subtasks };
               } catch (err) {
                    const error = err as Error;
                    console.error('[getSubtasks] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, { storyId }) => [{ type: 'Task', id: `subtasks-${storyId}` }],
     }),

     addSubtask: builder.mutation<Task, { storyId: string; title: string; boardId: string; columnId: string }>({
          async queryFn({ storyId, title, boardId, columnId }) {
               try {
                    // Get max sort_order for subtasks
                    const { data: existingSubtasks } = await getSupabase().from('tasks').select('sort_order').eq('parent_id', storyId).order('sort_order', { ascending: false }).limit(1);

                    const maxOrder = existingSubtasks?.[0]?.sort_order ?? -1;

                    const payload = {
                         title,
                         description: '',
                         board_id: boardId,
                         column_id: columnId,
                         parent_id: storyId,
                         type: 'task' as const,
                         completed: false,
                         sort_order: maxOrder + 1,
                    };

                    const { data, error } = await getSupabase().from('tasks').insert(payload).select('*').single();

                    if (error || !data) throw error || new Error('Failed to add subtask');

                    const subtask: Task = {
                         id: data.id,
                         title: data.title,
                         description: data.description ?? '',
                         column_id: data.column_id,
                         board_id: data.board_id,
                         priority: data.priority ?? '',
                         user_id: data.user_id,
                         order: data.sort_order ?? 0,
                         sort_order: data.sort_order ?? 0,
                         completed: data.completed,
                         created_at: data.created_at,
                         updated_at: data.updated_at,
                         type: data.type,
                         parent_id: data.parent_id,
                    };

                    return { data: subtask };
               } catch (err) {
                    const error = err as Error;
                    console.error('[addSubtask] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { storyId }) => [
               { type: 'Task', id: `subtasks-${storyId}` },
               { type: 'Task', id: storyId },
          ],
     }),

     updateSubtaskCompletion: builder.mutation<void, { subtaskId: string; completed: boolean; storyId: string }>({
          async queryFn({ subtaskId, completed }) {
               try {
                    const { error } = await getSupabase().from('tasks').update({ completed }).eq('id', subtaskId);

                    if (error) throw error;
                    return { data: undefined };
               } catch (err) {
                    const error = err as Error;
                    console.error('[updateSubtaskCompletion] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { storyId, subtaskId }) => [
               { type: 'Task', id: `subtasks-${storyId}` },
               { type: 'Task', id: storyId },
               { type: 'Task', id: subtaskId },
          ],
     }),

     removeSubtask: builder.mutation<void, { subtaskId: string; storyId: string }>({
          async queryFn({ subtaskId }) {
               try {
                    const { error } = await getSupabase().from('tasks').delete().eq('id', subtaskId);

                    if (error) throw error;
                    return { data: undefined };
               } catch (err) {
                    const error = err as Error;
                    console.error('[removeSubtask] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { storyId }) => [
               { type: 'Task', id: `subtasks-${storyId}` },
               { type: 'Task', id: storyId },
          ],
     }),

     reorderSubtasks: builder.mutation<void, { storyId: string; subtaskIds: string[] }>({
          async queryFn({ subtaskIds }) {
               try {
                    // Update sort_order for each subtask
                    const updates = subtaskIds.map((id, index) => getSupabase().from('tasks').update({ sort_order: index }).eq('id', id));

                    await Promise.all(updates);
                    return { data: undefined };
               } catch (err) {
                    const error = err as Error;
                    console.error('[reorderSubtasks] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { storyId }) => [{ type: 'Task', id: `subtasks-${storyId}` }],
     }),

     updateTaskType: builder.mutation<Task, { taskId: string; type: 'task' | 'story' }>({
          async queryFn({ taskId, type }) {
               try {
                    // If converting to task, check if it has subtasks
                    if (type === 'task') {
                         const { data: subtasks } = await getSupabase().from('tasks').select('id').eq('parent_id', taskId).limit(1);

                         if (subtasks && subtasks.length > 0) {
                              throw new Error('Cannot convert Story to Task: has subtasks');
                         }
                    }

                    // If converting to story, clear parent_id and disable recurring
                    const updatePayload: Record<string, unknown> = { type };
                    if (type === 'story') {
                         updatePayload.parent_id = null;
                         updatePayload.is_recurring = false;
                         updatePayload.recurrence_type = null;
                         updatePayload.recurrence_interval = null;
                         updatePayload.recurrence_column_id = null;
                         updatePayload.next_occurrence_date = null;
                    }

                    const { data, error } = await getSupabase().from('tasks').update(updatePayload).eq('id', taskId).select('*').single();

                    if (error || !data) throw error || new Error('Failed to update task type');

                    const task: Task = {
                         id: data.id,
                         title: data.title,
                         description: data.description ?? '',
                         column_id: data.column_id,
                         board_id: data.board_id,
                         priority: data.priority ?? '',
                         user_id: data.user_id,
                         order: data.sort_order ?? 0,
                         sort_order: data.sort_order ?? 0,
                         completed: data.completed,
                         created_at: data.created_at,
                         updated_at: data.updated_at,
                         type: data.type,
                         parent_id: data.parent_id,
                    };

                    return { data: task };
               } catch (err) {
                    const error = err as Error;
                    console.error('[updateTaskType] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { taskId }) => [{ type: 'Task', id: taskId }],
     }),
});

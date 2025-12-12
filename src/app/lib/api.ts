import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Session } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { ApiTask, Board, Column, Priority, Task, User } from '@/app/types/globalTypes';

// ---- Supabase Client (lazy initialization) ----
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
     if (!supabaseInstance) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
          supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
     }
     return supabaseInstance;
}

// For backward compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
     get(_, prop) {
          return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
     },
});

// -------------------------------------
// ------- Board CRUD / Templates ------
// -------------------------------------

/**
 * Get a board by its ID with all its columns and tasks.
 */
export const getBoardById = async (boardId: string): Promise<Board | null> => {
     try {
          const { data: board, error: boardError } = await getSupabase().from('boards').select('*').eq('id', boardId).single();

          if (boardError || !board) throw boardError || new Error('Board not found');

          const { data: columns, error: colError } = await getSupabase().from('columns').select('*, tasks(*)').eq('board_id', boardId).order('order', { ascending: true });

          if (colError) throw colError;

          // Sort tasks in each column
          const columnsWithTasks: Column[] = (columns || []).map((col) => ({
               id: col.id,
               boardId: col.board_id,
               title: col.title,
               order: col.order,
               tasks: (col.tasks || []).sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0)) as Task[],
          }));

          // Sort columns by 'order'
          columnsWithTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          return {
               ...board,
               columns: columnsWithTasks,
          };
     } catch (error) {
          console.error('Error in getBoardById:', error);
          return null;
     }
};

/**
 * Create a new board for a user.
 */
export const addBoard = async ({ title, owner, userId }: { title: string; owner: string; userId: string }) => {
     const { data, error } = await supabase
          .from('boards')
          .insert([{ title, owner, user_id: userId }])
          .select()
          .single();
     if (error) throw error;
     return data;
};

/**
 * Get all boards belonging to a user by their email.
 */
export const getAllBoardsForUser = async (email: string): Promise<Board[]> => {
     try {
          const { data: user, error: userError } = await getSupabase().from('users').select('id').eq('email', email).single();

          if (userError || !user) throw userError || new Error('User not found');
          const userId = user.id;

          const { data: ownedBoards, error: ownedError } = await getSupabase().from('boards').select('*').eq('user_id', userId);

          if (ownedError) throw ownedError;

          // Sort by most recently created
          return (ownedBoards || []).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
     } catch (error) {
          console.error('Error in getAllBoardsForUser:', error);
          return [];
     }
};

/**
 * Create a new board based on a template (copies columns).
 */
export const createBoardFromTemplate = async (title: string, templateId: string, userId: string) => {
     const { data: newBoard, error: boardError } = await supabase
          .from('boards')
          .insert([
               {
                    id: uuidv4(),
                    title,
                    owner: userId,
                    user_id: userId,
               },
          ])
          .select()
          .single();
     if (boardError || !newBoard) throw boardError || new Error('Board creation failed');

     // Get template columns
     const { data: templateColumns, error: templateError } = await getSupabase().from('template_columns').select('*').eq('template_id', templateId);
     if (templateError) throw templateError;

     if (!templateColumns || templateColumns.length === 0) {
          return newBoard;
     }

     // Insert columns into new board
     const columnsToInsert = templateColumns.map((col) => ({
          id: uuidv4(),
          title: col.title,
          order: col.order,
          board_id: newBoard.id,
     }));

     const { error: insertColsError } = await getSupabase().from('columns').insert(columnsToInsert);
     if (insertColsError) throw insertColsError;

     return newBoard;
};

// -------------------------------------
// -------- Board Templates CRUD -------
// -------------------------------------

/**
 * Get all board templates, including their columns.
 */
export async function getBoardTemplates() {
     const { data, error } = await supabase
          .from('board_templates')
          .select(
               `
      id,
      name,
      description,
      is_custom,
      created_at,
      updated_at,
      template_columns (
        id,
        template_id,
        title,
        order,
        created_at
      )
    `,
          )
          .order('is_custom', { ascending: true })
          .order('name', { ascending: true });

     if (error) throw new Error(error.message);

     return (
          data?.map((template) => ({
               ...template,
               template_columns: template.template_columns || [],
          })) || []
     );
}

/**
 * Add a new board template with columns.
 */
export async function addBoardTemplate(templateData: { name: string; description: string | null; columns: { title: string; order: number }[] }) {
     const { data: template, error: templateError } = await supabase
          .from('board_templates')
          .insert({
               name: templateData.name,
               description: templateData.description,
               is_custom: true,
          })
          .select()
          .single();

     if (templateError) throw new Error(templateError.message);

     const columnsToInsert = templateData.columns.map((col) => ({
          template_id: template.id,
          title: col.title,
          order: col.order,
     }));

     const { data: columns, error: columnsError } = await getSupabase().from('template_columns').insert(columnsToInsert).select();

     if (columnsError) throw new Error(columnsError.message);

     return {
          ...template,
          template_columns: columns || [],
     };
}

/**
 * Delete a board template and its columns.
 */
export async function deleteBoardTemplate(templateId: string) {
     const { error: columnsError } = await getSupabase().from('template_columns').delete().eq('template_id', templateId);

     if (columnsError) throw new Error(columnsError.message);

     const { error: templateError } = await getSupabase().from('board_templates').delete().eq('id', templateId);

     if (templateError) throw new Error(templateError.message);
}

// -------------------------------------
// ---------- Priorities CRUD ----------
// -------------------------------------

/**
 * Get all priorities, or fallback to defaults.
 */
export const getPriorities = async (): Promise<{ id: string; label: string; color: string }[]> => {
     const { data, error } = await getSupabase().from('priorities').select('id, label, color').order('id');

     if (error) {
          throw new Error(error.message);
     }

     return (
          data || [
               { id: 'low', label: 'Low', color: '#10b981' },
               { id: 'medium', label: 'Medium', color: '#f59e0b' },
               { id: 'high', label: 'High', color: '#ef4444' },
               { id: 'urgent', label: 'Urgent', color: '#dc2626' },
          ]
     );
};

/**
 * Add a new priority.
 */
export const addPriority = async (label: string, color: string): Promise<Priority> => {
     const newId = uuidv4();

     const { data, error } = await supabase
          .from('priorities')
          .insert({
               id: newId,
               label,
               color,
          })
          .select()
          .single();

     if (error) throw new Error(error.message);

     return data;
};

/**
 * Update an existing priority.
 */
export const updatePriority = async (id: string, label: string, color: string): Promise<Priority> => {
     const { data, error } = await getSupabase().from('priorities').update({ label, color }).eq('id', id).select().single();

     if (error) throw new Error(error.message);

     return data;
};

/**
 * Delete a priority by ID.
 */
export const deletePriority = async (id: string): Promise<void> => {
     const { error } = await getSupabase().from('priorities').delete().eq('id', id);
     if (error) throw new Error(error.message);
};

// -------------------------------------
// ------------- Tasks -----------------
// -------------------------------------

/**
 * Get all tasks for a board, normalized to ApiTask.
 */
export const getTasksWithDates = async (boardId: string): Promise<ApiTask[]> => {
     const { data, error } = await supabase
          .from('tasks')
          .select(
               `
      id,
      title,
      description,
      column_id,
      board_id,
      start_date,
      end_date,
      due_date,
      completed,
      user_id,
      status,
      images,
      assignee:user_id(id, name, email, image, custom_name, custom_image),
      priority:priority(id, label, color)
    `,
          )
          .eq('board_id', boardId);

     if (error) throw error;

     // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
     const normalized: ApiTask[] = (data ?? []).map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description ?? null,
          column_id: task.column_id,
          board_id: task.board_id,
          start_date: task.start_date ?? null,
          end_date: task.end_date ?? null,
          due_date: task.due_date ?? null,
          completed: task.completed,
          assignee: Array.isArray(task.assignee) && task.assignee.length > 0 ? task.assignee[0] : null,
          priority: Array.isArray(task.priority) && task.priority.length > 0 ? task.priority[0] : null,
          user_id: task.user_id ?? null,
          status: task.status ?? null,
          images: task.images ?? null,
     }));
     // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←

     // Sort tasks by due_date, earliest first (example)
     return normalized.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
     });
};

/**
 * Get a single task by its ID (ApiTask + extras).
 */
export const getTaskById = async (taskId: string): Promise<ApiTask | null> => {
     const { data, error } = await supabase
          .from('tasks')
          .select(
               `
      id,
      title,
      description,
      column_id,
      board_id,
      start_date,
      end_date,
      due_date,
      completed,
      user_id,
      status,
      images,
      priority_data:priority(id, label, color),
      assignee:user_id(id, name, email, image, custom_name, custom_image),
      attachments,
      comments(*)
    `,
          )
          .eq('id', taskId)
          .single();

     if (error) throw error;

     return {
          ...data,
          assignee: Array.isArray(data.assignee) ? data.assignee[0] : data.assignee,
          priority: Array.isArray(data.priority_data) ? data.priority_data[0] : data.priority_data,
     } as ApiTask;
};

/**
 * Update start and end dates for a task.
 */
export const updateTaskDates = async (taskId: string, startDate: string | null, endDate: string | null) => {
     const { error } = await getSupabase().from('tasks').update({ start_date: startDate, end_date: endDate }).eq('id', taskId);
     if (error) throw error;
};

// -------------------------------------
// ------------- Users -----------------
// -------------------------------------

/**
 * Get a user's ID by their email.
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
     const { data, error } = await getSupabase().from('users').select('id').eq('email', email).single();

     if (error) {
          console.error('getUserIdByEmail error:', error.message);
          return null;
     }

     return data?.id || null;
}

/**
 * Ensure user exists in the DB for a given session.
 */
export async function fetchOrCreateUserFromSession(session: Session): Promise<User | null> {
     const email = session.user?.email;

     if (!email) return null;

     try {
          const { data: existingUser, error } = await getSupabase().from('users').select('*').eq('email', email).single();

          if (existingUser) return existingUser;

          if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
               const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                         email,
                         name: session.user.name || 'Unknown User',
                         image: session.user.image || null,
                    })
                    .select()
                    .single();

               if (insertError) throw insertError;

               return newUser;
          }

          throw error;
     } catch (err) {
          console.error('fetchOrCreateUserFromSession error:', err);
          return null;
     }
}

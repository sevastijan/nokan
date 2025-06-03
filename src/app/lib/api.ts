import { createClient } from "@supabase/supabase-js";
import { Task } from "../types/useBoardTypes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches a board by its ID, including its columns and tasks
 * @param {string} id - The ID of the board
 * @returns {Promise<Object>} The board data
 * @throws {Error} Throws if board is not found or query fails
 */
export async function getBoardById(id: string) {
  const { data, error } = await supabase
    .from("boards")
    .select(`
      id,
      title,
      columns (
        id,
        title,
        order,
        board_id,
        tasks (
          id,
          title,
          order,
          description,
          priority,
          images,
          user_id,
          column_id,
          created_at,
          updated_at,
          assignee:users!tasks_user_id_fkey(id, name, email, image),
          priorities(id, label, color)
        )
      )
    `)
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Board with id ${id} not found`);
  }

  return data[0];
}

/**
 * Fetches all boards
 * @returns {Promise<Array>} List of all boards
 * @throws {Error} Throws if query fails
 */
export async function getBoards() {
  const { data, error } = await supabase.from("boards").select("*");

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Adds a new board
 * @param {Object} params - Board details
 * @param {string} params.title - Title of the board
 * @returns {Promise<Object>} The newly created board
 * @throws {Error} Throws if insert fails or no data returned
 */
export const addBoard = async ({ title }: { title: string }) => {
  const { data, error } = await supabase
    .from("boards")
    .insert([{ title }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from the database.");
  }

  return data[0];
};

/**
 * Adds a new column to a board
 * @param {string} boardId - ID of the board
 * @param {string} title - Title of the column
 * @param {number} order - Order/index of the column
 * @returns {Promise<Object>} The newly created column
 * @throws {Error} Throws if insert fails
 */
export async function addColumn(boardId: string, title: string, order: number) {
  const { data, error } = await supabase
    .from("columns")
    .insert([{ board_id: boardId, title, order }])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

/**
 * Adds a new task to a column
 * @param {string} columnId - ID of the column
 * @param {string} title - Title of the task
 * @param {number} order - Order/index of the task
 * @param {string} [priority] - Optional priority ID
 * @param {string} [userId] - Optional user ID for assignee
 * @returns {Promise<Object>} The newly created task with related data
 * @throws {Error} Throws if column doesn't exist or insert fails
 */
export const addTask = async (
  columnId: string,
  title: string,
  order: number,
  priority?: string,
  userId?: string
) => {
  // Validate column existence
  const { data: columnExists, error: columnError } = await supabase
    .from("columns")
    .select("id")
    .eq("id", columnId)
    .single();

  if (columnError || !columnExists) {
    throw new Error(`Column with ID ${columnId} does not exist`);
  }

  const taskData: any = {
    column_id: columnId,
    title,
    order,
    priority: priority || null,
    user_id: userId || null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Updates the title of a board
 * @param {string} boardId - ID of the board to update
 * @param {string} newTitle - New title of the board
 * @throws {Error} Throws if update fails
 */
export async function updateBoardTitle(boardId: string, newTitle: string) {
  const { error } = await supabase
    .from("boards")
    .update({ title: newTitle })
    .eq("id", boardId);

  if (error) {
    throw error;
  }
}

/**
 * Updates the title of a task
 * @param {string} taskId - ID of the task to update
 * @param {string} newTitle - New title of the task
 * @throws {Error} Throws if update fails
 */
export async function updateTaskTitle(taskId: string, newTitle: string) {
  const { error } = await supabase
    .from("tasks")
    .update({ title: newTitle })
    .eq("id", taskId);

  if (error) {
    throw error;
  }
}

/**
 * Updates the title of a column
 * @param {string} columnId - ID of the column to update
 * @param {string} newTitle - New title of the column
 * @throws {Error} Throws if update fails
 */
export async function updateColumnTitle(columnId: string, newTitle: string) {
  const { error } = await supabase
    .from("columns")
    .update({ title: newTitle })
    .eq("id", columnId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a column by its ID
 * @param {string} columnId - ID of the column to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteColumn(columnId: string) {
  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a task by its ID
 * @param {string} taskId - ID of the task to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a board by its ID
 * @param {string} boardId - ID of the board to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteBoard(boardId: string) {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    throw error;
  }
}

/**
 * Fetches a single task by its ID with related assignee and priority
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object>} Task data with related info
 * @throws {Error} Throws if query fails
 */
export async function getTaskById(taskId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .eq("id", taskId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates details of a task
 * @param {string} taskId - ID of the task
 * @param {Object} updates - Fields to update
 * @param {string} [updates.title] - New task title
 * @param {string} [updates.description] - New task description
 * @param {string|null} [updates.priority] - New priority ID or null
 * @param {Array<string>} [updates.images] - New list of image URLs
 * @returns {Promise<Object>} Updated task with related data
 * @throws {Error} Throws if update fails
 */
export async function updateTaskDetails(
  taskId: string,
  updates: { title?: string; description?: string; priority?: string | null; images?: string[] }
) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Fetches all priorities
 * @returns {Promise<Array>} List of priorities
 * @throws {Error} Throws if query fails
 */
export async function getPriorities() {
  const { data, error } = await supabase
    .from("priorities")
    .select("*")
    .order("id");

  if (error) {
    throw new Error("Failed to fetch priorities");
  }

  return data || [];
}

/**
 * Adds a new priority
 * @param {string} label - Priority label
 * @param {string} color - Priority color
 * @returns {Promise<Object>} Created priority
 * @throws {Error} Throws if insert fails or no data returned
 */
export async function addPriority(label: string, color: string) {
  const { data, error } = await supabase
    .from("priorities")
    .insert([{ label, color }])
    .select()
    .single();

  if (error) {
    throw new Error("Failed to add priority");
  }

  if (!data) {
    throw new Error("No data returned from the database");
  }

  return data;
}

/**
 * Deletes a priority by its ID
 * @param {string} id - Priority ID
 * @throws {Error} Throws if deletion fails
 */
export async function deletePriority(id: string) {
  const { error } = await supabase
    .from("priorities")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Failed to delete priority");
  }
}

/**
 * Updates a task with new data
 * @param {string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.priority] - Task priority
 * @returns {Promise<Task>} Updated task object
 * @throws {Error} Throws if update fails
 */
export const updateTask = async (taskId: string, taskData: {
  title: string;
  description?: string;
  priority?: string;
}): Promise<Task> => {
  const { data, error } = await supabase
    .from("tasks")
    .update(taskData)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update task");
  }

  return data;
};

export async function createAttachmentsBucket() {
  const { data, error } = await supabase.storage.createBucket('attachments', {
    public: false,
    allowedMimeTypes: ['image/*', 'application/pdf', 'text/*', 'application/*'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error && error.message !== 'Bucket already exists') {
    console.error('Error creating bucket:', error);
    throw error;
  }

  return data;
}

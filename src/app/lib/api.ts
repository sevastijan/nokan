import { createClient } from "@supabase/supabase-js";
import { Task } from "../types/useBoardTypes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches a board by its ID, including its columns and tasks
 * @param {string} id - The ID of the board to fetch
 * @returns {Promise<Object>} The board data
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
    console.error("Error fetching board:", error.message);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Board with id ${id} not found`);
  }

  return data[0];
}

/**
 * Fetches all boards
 * @returns {Promise<Array>} The list of boards
 */
export async function getBoards() {
  const { data, error } = await supabase.from("boards").select("*");

  if (error) {
    console.error("Error fetching boards:", error.message);
    throw error;
  }

  return data;
}

/**
 * Adds a new board
 * @param {Object} params - The parameters for the new board
 * @param {string} params.title - The title of the new board
 * @returns {Promise<Object>} The created board
 */
export const addBoard = async ({ title }: { title: string }) => {
  const { data, error } = await supabase
    .from("boards")
    .insert([{ title }]) 
    .select();

  if (error) {
    console.error("Error adding board:", error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from the database.");
  }

  return data[0];
};

/**
 * Adds a new column to a board
 * @param {string} boardId - The ID of the board
 * @param {string} title - The title of the column
 * @param {number} order - The order of the column
 * @returns {Promise<Object>} The created column
 */
export async function addColumn(boardId: string, title: string, order: number) {
  const { data, error } = await supabase
    .from("columns")
    .insert([{ board_id: boardId, title, order }])
    .select();

  if (error) {
    console.error("Error adding column:", error.message);
    throw error;
  }

  return data[0];
}

/**
 * Adds a new task to a column
 * @param {string} columnId - The ID of the column
 * @param {string} title - The title of the task
 * @param {number} order - The order of the task
 * @param {string} [priority] - The priority of the task (optional)
 * @param {string} [userId] - The user ID associated with the task (optional)
 * @returns {Promise<Object>} The created task
 */
export const addTask = async (
  columnId: string,
  title: string,
  order: number,
  priority?: string,
  userId?: string
) => {
  // Validate that the column exists first
  const { data: columnExists, error: columnError } = await supabase
    .from("columns")
    .select("id")
    .eq("id", columnId)
    .single();

  if (columnError || !columnExists) {
    console.error("Column validation failed:", columnError);
    throw new Error(`Column with ID ${columnId} does not exist`);
  }

  const taskData: any = {
    column_id: columnId,
    title,
    order,
    priority: priority || null, // null powinno działać
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
    console.error("Error adding task:", error);
    throw error;
  }

  console.log("Task added successfully:", data);
  return data;
};

/**
 * Updates the title of a board
 * @param {string} boardId - The ID of the board
 * @param {string} newTitle - The new title of the board
 */
export async function updateBoardTitle(boardId: string, newTitle: string) {
  const { error } = await supabase
    .from("boards")
    .update({ title: newTitle })
    .eq("id", boardId);

  if (error) {
    console.error("Error updating board title:", error.message);
    throw error;
  }
}

/**
 * Updates the title of a task
 * @param {string} taskId - The ID of the task
 * @param {string} newTitle - The new title of the task
 */
export async function updateTaskTitle(taskId: string, newTitle: string) {
  const { error } = await supabase
    .from("tasks")
    .update({ title: newTitle })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task title:", error.message);
    throw error;
  }
}

/**
 * Updates the title of a column
 * @param {string} columnId - The ID of the column
 * @param {string} newTitle - The new title of the column
 */
export async function updateColumnTitle(columnId: string, newTitle: string) {
  const { error } = await supabase
    .from("columns")
    .update({ title: newTitle })
    .eq("id", columnId);

  if (error) {
    console.error("Error updating column title:", error.message);
    throw error;
  }
}

/**
 * Deletes a column by its ID
 * @param {string} columnId - The ID of the column to delete
 */
export async function deleteColumn(columnId: string) {
  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) {
    console.error("Error deleting column:", error.message);
    throw error;
  }
}

/**
 * Deletes a task by its ID
 * @param {string} taskId - The ID of the task to delete
 */
export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error.message);
    throw error;
  }
}

/**
 * Deletes a board by its ID
 * @param {string} boardId - The ID of the board to delete
 */
export async function deleteBoard(boardId: string) {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    console.error("Error deleting board:", error.message);
    throw error;
  }
}

/**
 * Fetches a single task by its ID with all related data
 * @param {string} taskId - The ID of the task
 * @returns {Promise<Object>} The task data with related information
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
    console.error("Error fetching task:", error.message);
    throw error;
  }

  return data;
}

/**
 * Updates the details of a task
 * @param {string} taskId - The ID of the task
 * @param {Object} updates - The updates to apply
 * @param {string} [updates.title] - The new title of the task
 * @param {string} [updates.description] - The new description of the task
 * @param {string} [updates.priority] - The new priority ID of the task
 * @param {Array<string>} [updates.images] - The new list of image URLs
 */
export async function updateTaskDetails(
  taskId: string,
  updates: { title?: string; description?: string; priority?: string | null; images?: string[] }
) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...updates,
      updated_at: new Date().toISOString() // Dodaj aktualizację updated_at
    })
    .eq("id", taskId)
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .single();

  if (error) {
    console.error("Error updating task:", error.message);
    throw error;
  }

  return data;
}

/**
 * Fetches all priorities
 * @returns {Promise<Array>} The list of priorities
 */
export async function getPriorities() {
  const { data, error } = await supabase
    .from("priorities")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error fetching priorities:", error.message);
    throw new Error("Failed to fetch priorities");
  }

  return data || [];
}

/**
 * Adds a new priority
 * @param {string} label - The label of the priority
 * @param {string} color - The color of the priority
 * @returns {Promise<Object>} The created priority
 */
export async function addPriority(label: string, color: string) {
  const { data, error } = await supabase
    .from("priorities")
    .insert([{ label, color }])
    .select()
    .single();

  if (error) {
    console.error("Error adding priority:", error.message);
    throw new Error("Failed to add priority");
  }

  if (!data) {
    throw new Error("No data returned from the database");
  }

  return data;
}

/**
 * Deletes a priority by its ID
 * @param {string} id - The ID of the priority to delete
 */
export async function deletePriority(id: string) {
  const { error } = await supabase
    .from("priorities")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting priority:", error.message);
    throw new Error("Failed to delete priority");
  }
}

/**
 * Update task with new data
 * @param {string} taskId - ID of the task to update
 * @param {Object} taskData - New task data
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.priority] - Task priority
 * @returns {Promise<Task>} Updated task data
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
    console.error("Error updating task:", error.message);
    throw new Error("Failed to update task");
  }

  return data;
};
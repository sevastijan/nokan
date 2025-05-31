// lib/api.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches a board by its ID, including its columns and tasks.
 *
 * @param {string} id - The ID of the board to fetch.
 * @returns {Promise<Object>} The board data.
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
        tasks (
          id,
          title,
          order
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching board:", error.message);
    throw error;
  }

  return data;
}

/**
 * Fetches all boards.
 *
 * @returns {Promise<Array>} The list of boards.
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
 * Adds a new board.
 *
 * @param {Object} params - The parameters for the new board.
 * @param {string} params.title - The title of the new board.
 * @returns {Promise<Object>} The created board.
 */
export const addBoard = async ({ title }: { title: string }) => {
  const { data, error } = await supabase
    .from("boards")
    .insert([{ title, user_id: null }])
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
 * Adds a new column to a board.
 *
 * @param {string} boardId - The ID of the board.
 * @param {string} title - The title of the column.
 * @param {number} order - The order of the column.
 * @returns {Promise<Object>} The created column.
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
 * Adds a new task to a column.
 *
 * @param {string} columnId - The ID of the column.
 * @param {string} title - The title of the task.
 * @param {number} order - The order of the task.
 * @returns {Promise<Object>} The created task.
 */
export async function addTask(columnId: string, title: string, order: number) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ column_id: columnId, title, order }])
    .select();

  if (error) {
    console.error("Error adding task:", error.message);
    throw error;
  }

  return data[0];
}

/**
 * Updates the title of a board.
 *
 * @param {string} boardId - The ID of the board.
 * @param {string} newTitle - The new title of the board.
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
 * Updates the title of a task.
 *
 * @param {string} taskId - The ID of the task.
 * @param {string} newTitle - The new title of the task.
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
 * Updates the title of a column.
 *
 * @param {string} columnId - The ID of the column.
 * @param {string} newTitle - The new title of the column.
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
 * Deletes a column by its ID.
 *
 * @param {string} columnId - The ID of the column to delete.
 */
export async function deleteColumn(columnId: string) {
  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) {
    console.error("Error deleting column:", error.message);
    throw error;
  }
}

/**
 * Deletes a task by its ID.
 *
 * @param {string} taskId - The ID of the task to delete.
 */
export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error.message);
    throw error;
  }
}

/**
 * Deletes a board by its ID.
 *
 * @param {string} boardId - The ID of the board to delete.
 */
export async function deleteBoard(boardId: string) {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    console.error("Error deleting board:", error.message);
    throw error;
  }
}
// lib/api.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch a board by its ID, including its columns and tasks
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

// Fetch all boards
export async function getBoards() {
  const { data, error } = await supabase
    .from("boards")
    .select("*");

  if (error) {
    console.error("Error fetching boards:", error.message);
    throw error;
  }

  return data;
}

// Add a new board
export const addBoard = async ({ title }: { title: string }) => {
  console.log("Inserting board with title:", title); // Debugowanie

  const { data, error } = await supabase
    .from("boards")
    .insert([{ title, user_id: null }]) // Ustawienie user_id na null
    .select();

  if (error) {
    console.error("Supabase error:", error.message); // Debugowanie
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from the database.");
  }

  console.log("Inserted board data:", data); // Debugowanie
  return data[0];
};
// Add a new column to a board
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

// Add a new task to a column
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

// Update the title of a board
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


// Delete a column by its ID
export async function deleteColumn(columnId: string) {
  const { error } = await supabase
    .from("columns")
    .delete()
    .eq("id", columnId);

  if (error) {
    console.error("Error deleting column:", error.message);
    throw error;
  }
}

// Delete a task by its ID
export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error.message);
    throw error;
  }
}

// Delete a board by its ID
export async function deleteBoard(boardId: string) {
  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId);

  if (error) {
    console.error("Error deleting board:", error.message);
    throw error;
  }
}
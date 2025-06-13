// src/lib/api.ts

import { createClient } from "@supabase/supabase-js";
import {
  Attachment,
  Board,
  Column,
  TeamMember,
  User,
  Priority,
  Task,
  ApiTask,
  Team,
} from "@/app/types/globalTypes";
import { Session } from "next-auth";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getBoardById = async (boardId: string): Promise<Board | null> => {
  try {
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (boardError || !board) throw boardError || new Error("Board not found");

    const { data: columns, error: colError } = await supabase
      .from("columns")
      .select("*, tasks(*)")
      .eq("board_id", boardId)
      .order("order", { ascending: true });

    if (colError) throw colError;

    const columnsWithTasks: Column[] = (columns || []).map((col) => ({
      id: col.id,
      boardId: col.board_id,
      title: col.title,
      order: col.order,
      tasks: (col.tasks || []).sort(
        (a: { order?: number }, b: { order?: number }) =>
          (a.order ?? 0) - (b.order ?? 0)
      ) as Task[],
    }));

    return {
      ...board,
      columns: columnsWithTasks,
    };
  } catch (error) {
    console.error("Error in getBoardById:", error);
    return null;
  }
};

export const getPriorities = async (): Promise<
  { id: string; label: string; color: string }[]
> => {
  const { data, error } = await supabase
    .from("priorities")
    .select("id, label, color")
    .order("id");

  if (error) {
    throw new Error(error.message);
  }

  return (
    data || [
      { id: "low", label: "Low", color: "#10b981" },
      { id: "medium", label: "Medium", color: "#f59e0b" },
      { id: "high", label: "High", color: "#ef4444" },
      { id: "urgent", label: "Urgent", color: "#dc2626" },
    ]
  );
};

export const addBoard = async ({
  title,
  owner,
  userId,
}: {
  title: string;
  owner: string;
  userId: string;
}) => {
  const { data, error } = await supabase
    .from("boards")
    .insert([{ title, owner, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllBoardsForUser = async (email: string): Promise<Board[]> => {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const userId = user.id;

    const { data: ownedBoards, error: ownedError } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", userId);

    if (ownedError) throw ownedError;

    // Opcjonalnie: jeżeli w przyszłości będziecie mieli tabelę board_access do współdzielenia,
    // możecie dodać tu odpowiednie selecty. Tutaj pozostawiamy podstawową logikę:
    return (ownedBoards || []).sort(
      (a, b) =>
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );
  } catch (error) {
    console.error("Error in getAllBoardsForUser:", error);
    return [];
  }
};

export const createBoardFromTemplate = async (
  title: string,
  templateId: string,
  userId: string
) => {
  const { data: newBoard, error: boardError } = await supabase
    .from("boards")
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

  if (boardError || !newBoard)
    throw boardError || new Error("Board creation failed");

  const { data: templateColumns, error: templateError } = await supabase
    .from("template_columns")
    .select("*")
    .eq("template_id", templateId);

  if (templateError) throw templateError;

  if (!templateColumns || templateColumns.length === 0) {
    return newBoard;
  }

  const columnsToInsert = templateColumns.map((col) => ({
    id: uuidv4(),
    title: col.title,
    order: col.order,
    board_id: newBoard.id,
  }));

  const { error: insertColsError } = await supabase
    .from("columns")
    .insert(columnsToInsert);

  if (insertColsError) throw insertColsError;

  return newBoard;
};

export async function getBoardTemplates() {
  const { data, error } = await supabase
    .from("board_templates")
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
    `
    )
    .order("is_custom", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    data?.map((template) => ({
      ...template,
      template_columns: template.template_columns || [],
    })) || []
  );
}

export async function addBoardTemplate(templateData: {
  name: string;
  description: string | null;
  columns: { title: string; order: number }[];
}) {
  const { data: template, error: templateError } = await supabase
    .from("board_templates")
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

  const { data: columns, error: columnsError } = await supabase
    .from("template_columns")
    .insert(columnsToInsert)
    .select();

  if (columnsError) throw new Error(columnsError.message);

  return {
    ...template,
    template_columns: columns || [],
  };
}

export async function deleteBoardTemplate(templateId: string) {
  const { error: columnsError } = await supabase
    .from("template_columns")
    .delete()
    .eq("template_id", templateId);

  if (columnsError) throw new Error(columnsError.message);

  const { error: templateError } = await supabase
    .from("board_templates")
    .delete()
    .eq("id", templateId);

  if (templateError) throw new Error(templateError.message);
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (error) {
    console.error("getUserIdByEmail error:", error.message);
    return null;
  }

  return data?.id || null;
}

export async function fetchOrCreateUserFromSession(
  session: Session
): Promise<User | null> {
  const email = session.user?.email;

  if (!email) return null;

  try {
    const { data: existingUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) return existingUser;

    if (error?.code === "PGRST116" || error?.message.includes("No rows")) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          email,
          name: session.user.name || "Unknown User",
          image: session.user.image || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return newUser;
    }

    throw error;
  } catch (err) {
    console.error("fetchOrCreateUserFromSession error:", err);
    return null;
  }
}

export const getTasksWithDates = async (
  boardId: string
): Promise<ApiTask[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      start_date,
      end_date,
      completed,
      assignee:user_id(id, name, email, image),
      priority_data:priority(id, label, color)
    `
    )
    .eq("board_id", boardId);

  if (error) throw error;
  //@ts-ignore
  const normalized: ApiTask[] = (data ?? []).map((task: any) => {
    const assignee =
      Array.isArray(task.assignee) && task.assignee.length > 0
        ? task.assignee[0]
        : task.assignee ?? null;

    const priority =
      Array.isArray(task.priority_data) && task.priority_data.length > 0
        ? task.priority_data[0]
        : task.priority_data ?? null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      start_date: task.start_date,
      end_date: task.end_date,
      completed: task.completed,
      assignee,
      priority,
    };
  });

  return normalized;
};

export const getTaskById = async (taskId: string): Promise<ApiTask | null> => {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      start_date,
      end_date,
      completed,
      priority_data:priority(id, label, color),
      assignee:user_id(id, name, email, image), 
      attachments,
      comments(*)
    `
    )
    .eq("id", taskId)
    .single();

  if (error) throw error;

  //@ts-ignore
  return {
    ...data,
    assignee: Array.isArray(data.assignee) ? data.assignee[0] : data.assignee,
    priority: Array.isArray(data.priority_data)
      ? data.priority_data[0]
      : data.priority_data,
  };
};

export const updateTaskDates = async (
  taskId: string,
  startDate: string | null,
  endDate: string | null
) => {
  const { error } = await supabase
    .from("tasks")
    .update({ start_date: startDate, end_date: endDate })
    .eq("id", taskId);

  if (error) throw error;
};

export const addPriority = async (
  label: string,
  color: string
): Promise<Priority> => {
  const { data, error } = await supabase
    .from("priorities")
    .insert({ label, color })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Update an existing priority.
 */
export const updatePriority = async (
  id: string,
  label: string,
  color: string
): Promise<Priority> => {
  const { data, error } = await supabase
    .from("priorities")
    .update({ label, color })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const deletePriority = async (id: string): Promise<void> => {
  const { error } = await supabase.from("priorities").delete().eq("id", id);

  if (error) throw new Error(error.message);
};

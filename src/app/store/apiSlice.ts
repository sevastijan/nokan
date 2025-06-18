/**
 * apiSlice.ts
 *
 * This file defines the main API slice using Redux Toolkit Query (RTK Query) with a fakeBaseQuery.
 * It handles all interactions with the Supabase backend, including user management, board operations,
 * task management, team handling, notifications, and template-based board creation.
 *
 */

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "@/app/lib/supabase";
import { Session } from "next-auth";
import {
  User,
  Board,
  Column,
  Task,
  TaskDetail,
  Attachment,
  Team,
  TeamMember,
} from "@/app/types/globalTypes";

/**
 * UserRole type in your application.
 * Defines the possible roles a user can have: OWNER, PROJECT_MANAGER, or MEMBER.
 */
export type UserRole = "OWNER" | "PROJECT_MANAGER" | "MEMBER";

/**
 * BoardWithCounts extends Board by adding counts of tasks, team members, etc.
 * Used for fetching boards with additional metadata for display purposes.
 */
export interface BoardWithCounts extends Board {
  _count: {
    tasks: number;
    teamMembers: number;
    completedTasks?: number; // optional
  };
}

/**
 * The main API slice using RTK Query with fakeBaseQuery and manual Supabase calls in queryFn.
 * This slice defines all endpoints for interacting with the Supabase database.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(), // We use manual async queryFn calls to Supabase
  tagTypes: [
    "Board",
    "Column",
    "Task",
    "TeamMember",
    "UserRole",
    "TeamsList",
    "Team",
    "TasksWithDates",
    "Notification",
    "Boards",
    "Tasks",
  ],
  endpoints: (builder) => ({
    /**
     * addBoard
     *
     * Description: Adds a new board to the database with the provided title and user ID.
     * Input: { title: string, user_id: string }
     * Returns: Board object representing the newly created board.
     *
     * This mutation inserts a new row into the 'boards' table and returns the created board
     * with its associated metadata. It invalidates the 'Board' tag for the user's board list.
     */
    addBoard: builder.mutation<Board, { title: string; user_id: string }>({
      async queryFn({ title, user_id }) {
        try {
          const { data, error } = await supabase
            .from("boards")
            .insert({ title, user_id })
            .select("*")
            .single();
          if (error || !data) throw error || new Error("Add board failed");
          const newBoard: Board = {
            id: data.id,
            title: data.title,
            //@ts-ignore
            owner_id: data.user_id,
            ownerName: undefined,
            ownerEmail: undefined,
            columns: [],
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          return { data: newBoard };
        } catch (err: any) {
          console.error("[apiSlice.addBoard] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { user_id }) => [
        // Invalidate boards list for this user
        { type: "Board", id: "LIST" },
      ],
    }),

    /**
     * addBoardTemplate
     *
     * Description: Creates a new board template with columns and tasks.
     * Input: { name: string, description?: string | null, columns: { title: string, order: number, tasks: { title: string, description?: string | null }[] }[] }
     * Returns: Object containing the template and its columns with tasks.
     *
     * This mutation inserts a new template into 'board_templates', followed by columns into
     * 'template_columns', and tasks into 'template_tasks'. It invalidates the 'Board' tag for templates.
     */
    addBoardTemplate: builder.mutation<
      any,
      {
        name: string;
        description?: string | null;
        columns: {
          title: string;
          order: number;
          tasks: { title: string; description?: string | null }[];
        }[];
      }
    >({
      async queryFn({ name, description, columns }) {
        try {
          // 1. Stwórz template
          const { data: template, error: templateErr } = await supabase
            .from("board_templates")
            .insert({ name, description })
            .select("*")
            .single();
          if (templateErr || !template)
            throw templateErr || new Error("Template creation failed");
          const templateId = template.id;

          // 2. Wstaw kolumny
          const columnsToInsert = columns.map((col, idx) => ({
            title: col.title,
            order: col.order ?? idx,
            template_id: templateId,
          }));
          const { data: insertedCols, error: colsErr } = await supabase
            .from("template_columns")
            .insert(columnsToInsert)
            .select("*");
          if (colsErr || !insertedCols)
            throw colsErr || new Error("Columns creation failed");

          // 3. Wstaw zadania do template_tasks, używając pola column_id
          const templateTasksToInsert = insertedCols.flatMap((col, colIdx) =>
            (columns[colIdx].tasks || []).map((task, tIdx) => ({
              title: task.title,
              description: task.description || null,
              template_id: templateId,
              column_id: col.id,
              sort_order: tIdx,
            }))
          );
          if (templateTasksToInsert.length > 0) {
            const { error: tasksErr } = await supabase
              .from("template_tasks")
              .insert(templateTasksToInsert);
            if (tasksErr) throw tasksErr;
          }

          // 4. Zwróć nowo utworzony template razem z kolumnami
          return {
            data: {
              ...template,
              template_columns: insertedCols.map((col, idx) => ({
                ...col,
                tasks: columns[idx]?.tasks || [],
              })),
            },
          };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, _arg) => [
        { type: "Board", id: "TEMPLATE-LIST" },
      ],
    }),

    /**
     * addColumn
     *
     * Description: Adds a new column to a specified board.
     * Input: { board_id: string, title: string, order: number }
     * Returns: Column object representing the newly created column.
     *
     * This mutation inserts a new row into the 'columns' table and returns the created column.
     * It invalidates the 'Board' tag for the associated board.
     */
    addColumn: builder.mutation<
      Column,
      { board_id: string; title: string; order: number }
    >({
      async queryFn({ board_id, title, order }) {
        try {
          const { data, error } = await supabase
            .from("columns")
            .insert({ board_id, title, order })
            .select("*")
            .single();
          if (error || !data) throw error || new Error("Add column failed");
          const mapped: Column = {
            id: data.id,
            boardId: data.board_id,
            title: data.title,
            order: data.order,
            tasks: [],
          };
          return { data: mapped };
        } catch (err: any) {
          console.error("[apiSlice.addColumn] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { board_id }) => [
        { type: "Board", id: board_id },
      ],
    }),

    /**
     * addNotification
     *
     * Description: Adds a new notification for a user.
     * Input: { user_id: string, type: string, task_id?: string, board_id?: string, message: string }
     * Returns: Notification object representing the newly created notification.
     *
     * This mutation inserts a new row into the 'notifications' table and invalidates the
     * 'Notification' tag for the user.
     */
    addNotification: builder.mutation<
      any,
      {
        user_id: string;
        type: string;
        task_id?: string;
        board_id?: string;
        message: string;
      }
    >({
      async queryFn(payload) {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .insert({ ...payload, read: false })
            .select("*")
            .single();
          if (error || !data)
            throw error || new Error("Add notification failed");
          return { data };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { user_id }) => [
        { type: "Notification", id: user_id },
      ],
    }),

    /**
     * addStarterTask
     *
     * Description: Creates a new task from a template task and assigns it to a board and column.
     * Input: { templateTaskId: string, boardId: string, columnId: string, order: number }
     * Returns: Task object representing the newly created task.
     *
     * This mutation fetches a template task and inserts it into the 'tasks' table with the
     * specified board and column, invalidating the 'Column' tag.
     */
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
          // 1) fetch the template task
          const { data: templateTask, error } = await supabase
            .from("template_tasks")
            .select("*")
            .eq("id", templateTaskId)
            .single();
          if (error || !templateTask) {
            throw error || new Error("Template task not found");
          }

          // 2) insert into real tasks
          const insertPayload = {
            title: templateTask.title,
            description: templateTask.description,
            priority: templateTask.priority,
            board_id: boardId,
            column_id: columnId,
            sort_order: order,
            completed: false,
          };
          const { data: newTask, error: insertErr } = await supabase
            .from("tasks")
            .insert(insertPayload)
            .select("*")
            .single();
          if (insertErr || !newTask) {
            throw insertErr || new Error("Insert failed");
          }

          // 3) map to your Task interface
          const mapped: Task = {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description ?? "",
            column_id: newTask.column_id,
            board_id: newTask.board_id,
            priority: newTask.priority ?? "",
            user_id: newTask.user_id ?? undefined,
            order: newTask.sort_order ?? 0,
            sort_order: newTask.sort_order ?? 0,
            completed: newTask.completed,
            created_at: newTask.created_at ?? undefined,
            updated_at: newTask.updated_at ?? undefined,
            images: newTask.images ?? undefined,
            assignee: undefined,
            start_date: newTask.start_date ?? undefined,
            end_date: newTask.end_date ?? undefined,
            due_date: newTask.due_date ?? undefined,
            status: newTask.status ?? undefined,
          };
          return { data: mapped };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_res, _err, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /**
     * addTask
     *
     * Description: Adds a new task to a specified column with initial sort_order of 0.
     * Input: Partial<TaskDetail> & { column_id: string }
     * Returns: Task object representing the newly created task.
     *
     * This mutation inserts a new row into the 'tasks' table and invalidates the 'Column' tag
     * for the associated column.
     */
    addTask: builder.mutation<
      Task,
      Partial<TaskDetail> & { column_id: string }
    >({
      async queryFn({ column_id, ...rest }) {
        try {
          const payload: any = {
            ...rest,
            column_id,
            completed: false,
            sort_order: 0,
          };
          const { data, error } = await supabase
            .from("tasks")
            .insert(payload)
            .select("*")
            .single();
          if (error || !data) throw error || new Error("Add task failed");
          const mapped: Task = {
            id: data.id,
            title: data.title,
            description: data.description,
            column_id: data.column_id,
            board_id: data.board_id,
            priority: data.priority,
            user_id: data.user_id ?? undefined,
            order: data.sort_order ?? 0,
            completed: data.completed,
            created_at: data.created_at ?? undefined,
            updated_at: data.updated_at ?? undefined,
            images: data.images ?? undefined,
            assignee: undefined,
            start_date: data.start_date ?? undefined,
            end_date: data.end_date ?? undefined,
            due_date: data.due_date ?? undefined,
            status: data.status ?? undefined,
            sort_order: 0,
          };
          return { data: mapped };
        } catch (err: any) {
          console.error("[apiSlice.addTask] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { column_id }) => [
        { type: "Column", id: column_id },
      ],
    }),

    /**
     * addTeam
     *
     * Description: Creates a new team with specified members and owner.
     * Input: { name: string, owner_id: string, board_id?: string, members: string[] }
     * Returns: Team object with nested TeamMember[] and user info.
     *
     * This mutation inserts a new row into the 'teams' table and corresponding 'team_members',
     * invalidating the 'TeamsList' and 'Team' tags.
     */
    addTeam: builder.mutation<
      Team,
      { name: string; owner_id: string; board_id?: string; members: string[] }
    >({
      async queryFn({ name, owner_id, board_id, members }) {
        try {
          // Insert into teams
          const { data: newTeam, error: teamErr } = await supabase
            .from("teams")
            .insert({
              name,
              owner_id,
              board_id: board_id ?? null,
            })
            .select("*")
            .single();
          if (teamErr || !newTeam)
            throw teamErr || new Error("Failed to create team");
          const teamId = newTeam.id;
          // Ensure owner is included
          const uniqueMembers = Array.from(new Set([owner_id, ...members]));
          // Insert into team_members
          const inserts = uniqueMembers.map((userId) => ({
            team_id: teamId,
            user_id: userId,
          }));
          const { data: insertedMembers = [], error: membersErr } =
            await supabase
              .from("team_members")
              .insert(inserts)
              .select(
                "*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
              );
          if (membersErr) throw membersErr;
          const teamMembers: TeamMember[] = (insertedMembers as any[]).map(
            (r: any) => {
              const u = Array.isArray(r.user) ? r.user[0] : r.user;
              return {
                id: r.id,
                team_id: r.team_id,
                user_id: r.user_id,
                created_at: r.created_at ?? undefined,
                user: {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  image: u.image ?? undefined,
                  role: u.role ?? undefined,
                  created_at: u.created_at ?? undefined,
                },
              };
            }
          );
          const resultTeam: Team = {
            id: teamId,
            name: newTeam.name,
            board_id: newTeam.board_id ?? null,
            owner_id: newTeam.owner_id,
            users: teamMembers,
            created_at: newTeam.created_at ?? undefined,
          };
          return { data: resultTeam };
        } catch (err: any) {
          console.error("[apiSlice.addTeam] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (result, _error, _arg) =>
        [
          { type: "TeamsList", id: "LIST" },
          result ? { type: "Team" as const, id: result.id } : null,
        ].filter(Boolean) as any,
    }),

    /**
     * createBoardFromTemplate
     *
     * Description: Creates a new board from a specified template.
     * Input: { title: string, templateId: string, user_id: string }
     * Returns: Board object with columns (empty tasks).
     *
     * This mutation creates a new board, copies columns and tasks from a template, and
     * invalidates the 'Board' tag for the list.
     */
    createBoardFromTemplate: builder.mutation<
      Board,
      { title: string; templateId: string; user_id: string }
    >({
      async queryFn({ title, templateId, user_id }) {
        try {
          // 1. Create board
          const { data: newBoard, error: boardErr } = await supabase
            .from("boards")
            .insert({ title, user_id })
            .select("*")
            .single();
          if (boardErr || !newBoard)
            throw boardErr || new Error("Failed to create board");
          const boardId = newBoard.id;

          // 2. Get template columns
          const { data: templateCols, error: templateColsErr } = await supabase
            .from("template_columns")
            .select("*")
            .eq("template_id", templateId)
            .order("order", { ascending: true });
          if (templateColsErr) throw templateColsErr;
          if (!templateCols || templateCols.length === 0)
            throw new Error("No columns found for this template");

          // 3. Insert columns into new board
          const columnsToInsert = templateCols.map((col, idx) => ({
            title: col.title,
            order: col.order ?? idx,
            board_id: boardId,
          }));
          const { data: insertedColumns, error: columnsErr } = await supabase
            .from("columns")
            .insert(columnsToInsert)
            .select("*");
          if (columnsErr || !insertedColumns)
            throw columnsErr || new Error("Failed to create columns");

          // 4. Map template_column.id → new column.id
          const templateIdToColumnId: Record<string, string> = {};
          templateCols.forEach((tc, i) => {
            templateIdToColumnId[tc.id] = insertedColumns[i].id;
          });

          // 5. Fetch starter tasks from template_tasks
          const { data: templateTasks, error: tasksErr } = await supabase
            .from("template_tasks")
            .select("*")
            .eq("template_id", templateId)
            .order("sort_order", { ascending: true });
          if (tasksErr) throw tasksErr;

          // 6. Insert tasks into the new board
          if (templateTasks && templateTasks.length > 0) {
            const tasksToInsert = templateTasks.map((task) => ({
              title: task.title,
              description: task.description,
              priority: task.priority ?? null,
              board_id: boardId,
              column_id: templateIdToColumnId[task.column_id],
              sort_order: task.sort_order ?? 0,
              completed: false,
            }));
            const { error: insertTasksErr } = await supabase
              .from("tasks")
              .insert(tasksToInsert);
            if (insertTasksErr) throw insertTasksErr;
          }

          let ownerName, ownerEmail;
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("name,email")
              .eq("id", user_id)
              .single();
            if (userData) {
              ownerName = userData.name;
              ownerEmail = userData.email;
            }
          } catch {}

          const resultBoard: Board = {
            id: newBoard.id,
            title: newBoard.title,
            user_id: newBoard.user_id,
            ownerName,
            ownerEmail,
            columns: insertedColumns.map((c) => ({
              id: c.id,
              boardId: c.board_id,
              title: c.title,
              order: c.order,
              tasks: [], // tasks will be loaded via getBoard
            })),
            created_at: newBoard.created_at,
            updated_at: newBoard.updated_at,
          };

          return { data: resultBoard };
        } catch (err: any) {
          console.error("[apiSlice.createBoardFromTemplate] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, _arg) => [
        { type: "Board", id: "LIST" },
      ],
    }),

    /**
     * deleteNotification
     *
     * Description: Deletes a notification by its ID.
     * Input: { id: string }
     * Returns: Object with the deleted notification ID.
     *
     * This mutation removes a row from the 'notifications' table and invalidates the
     * 'Notification' tag for the ID.
     */
    deleteNotification: builder.mutation<{ id: string }, { id: string }>({
      async queryFn({ id }) {
        try {
          const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id);
          if (error) throw error;
          return { data: { id } };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Notification", id },
      ],
    }),

    /**
     * deleteTeam
     *
     * Description: Deletes a team and its associated team members.
     * Input: teamId: string
     * Returns: Object with the deleted team ID.
     *
     * This mutation removes rows from 'team_members' and 'teams' tables, invalidating
     * 'TeamsList' and 'Team' tags.
     */
    deleteTeam: builder.mutation<{ id: string }, string>({
      async queryFn(teamId) {
        try {
          // Delete members first
          const { error: delMembersErr } = await supabase
            .from("team_members")
            .delete()
            .eq("team_id", teamId);
          if (delMembersErr) throw delMembersErr;
          // Delete team
          const { error: delTeamErr } = await supabase
            .from("teams")
            .delete()
            .eq("id", teamId);
          if (delTeamErr) throw delTeamErr;
          return { data: { id: teamId } };
        } catch (err: any) {
          console.error("[apiSlice.deleteTeam] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "TeamsList", id: "LIST" },
        { type: "Team" as const, id },
      ],
    }),

    /**
     * getBoard
     *
     * Description: Fetches a full board by ID, including its columns and tasks.
     * Input: boardId: string
     * Returns: Board object with columns and tasks (with assignee flattening).
     *
     * This query fetches a board row, its columns, and tasks with assignee information,
     * providing tags for 'Board' and 'Column' invalidation.
     */
    getBoard: builder.query<Board, string>({
      async queryFn(boardId) {
        try {
          // 1) Fetch board row, including owner join
          const { data: bRaw, error: be } = await supabase
            .from("boards")
            .select(
              `
              *,
              owner:users!boards_user_id_fkey(id, name, email)
            `
            )
            .eq("id", boardId)
            .single();
          if (be || !bRaw) throw be || new Error("Board not found");

          // Flatten owner
          let ownerObj: any = null;
          if (Array.isArray(bRaw.owner) && bRaw.owner.length > 0) {
            ownerObj = bRaw.owner[0];
          } else if (bRaw.owner) {
            ownerObj = bRaw.owner;
          }
          const boardBase: Board = {
            id: bRaw.id,
            title: bRaw.title,
            user_id: bRaw.user_id,
            ownerName: ownerObj?.name,
            ownerEmail: ownerObj?.email,
            columns: [],
            created_at: bRaw.created_at ?? undefined,
            updated_at: bRaw.updated_at ?? undefined,
          };

          // 2) Fetch columns for this board, including tasks and assignee join
          const { data: colsRaw = [], error: ce } = await supabase
            .from("columns")
            .select(
              `
              *,
              tasks:tasks(
                *,
                assignee:users!tasks_user_id_fkey(
                  id,
                  name,
                  email,
                  image
                )
              )
            `
            )
            .eq("board_id", boardId)
            .order("order", { ascending: true });
          if (ce) throw ce;

          // Map columns + tasks
          boardBase.columns = (colsRaw || []).map((c: any) => {
            // Sort tasks by sort_order
            const rawTasks: any[] = Array.isArray(c.tasks) ? c.tasks : [];
            rawTasks.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            //@ts-ignore
            const mappedTasks: Task[] = rawTasks.map((t) => {
              const rawAssignee = Array.isArray(t.assignee)
                ? t.assignee[0]
                : t.assignee;
              const assigneeObj: User | undefined = rawAssignee
                ? {
                    id: rawAssignee.id,
                    name: rawAssignee.name,
                    email: rawAssignee.email,
                    image: rawAssignee.image ?? undefined,
                  }
                : undefined;
              return {
                id: t.id,
                title: t.title,
                description: t.description,
                column_id: t.column_id,
                board_id: t.board_id,
                priority: t.priority,
                user_id: t.user_id ?? undefined,
                order: t.sort_order ?? 0,
                completed: t.completed,
                created_at: t.created_at ?? undefined,
                updated_at: t.updated_at ?? undefined,
                images: t.images ?? undefined,
                assignee: assigneeObj,
                start_date: t.start_date ?? undefined,
                end_date: t.end_date ?? undefined,
                due_date: t.due_date ?? undefined,
                status: t.status ?? undefined,
              };
            });
            const col: Column = {
              id: c.id,
              boardId: c.board_id,
              title: c.title,
              order: c.order,
              tasks: mappedTasks,
            };
            return col;
          });

          return { data: boardBase };
        } catch (err: any) {
          console.error("[apiSlice.getBoard] error:", err);
          return {
            error: { status: "CUSTOM_ERROR", error: err.message },
          };
        }
      },
      providesTags: (result, _error, boardId) =>
        result
          ? [
              { type: "Board", id: boardId },
              // Tag each column for invalidation if needed
              ...result.columns.map((c) => ({
                type: "Column" as const,
                id: c.id,
              })),
            ]
          : [{ type: "Board", id: boardId }],
    }),

    /**
     * getCurrentUser
     *
     * Description: Fetches or creates the current user row in Supabase based on NextAuth session.
     * Input: Session object from NextAuth
     * Returns: User row with id, name, email, image, role, etc.
     *
     * This query checks for an existing user by email; if none exists, it creates a new user
     * row using session data, providing a 'UserRole' tag by email.
     */
    getCurrentUser: builder.query<User, Session>({
      /**
       * queryFn: called with NextAuth session.
       * - If a Supabase user row with this email exists, return it.
       * - Otherwise insert a new row using session.user fields.
       */
      async queryFn(session) {
        try {
          const email = session.user?.email || "";
          if (!email) {
            throw new Error("No email in session");
          }
          // Try fetch existing user row
          const { data: existing, error: fetchErr } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();
          if (fetchErr && !(fetchErr as any).message?.includes("No rows")) {
            // true error (not “no rows”)
            throw fetchErr;
          }
          if (existing) {
            // Found existing row
            return { data: existing };
          }
          // No existing row: insert new user
          const { data: created, error: createErr } = await supabase
            .from("users")
            .insert({
              email,
              name: session.user?.name,
              image: session.user?.image,
            })
            .select("*")
            .single();
          if (createErr || !created) {
            throw createErr || new Error("Failed to create user row");
          }
          return { data: created };
        } catch (err: any) {
          console.error("[apiSlice.getCurrentUser] error:", err);
          return {
            error: { status: "CUSTOM_ERROR", error: err.message },
          };
        }
      },
      /**
       * Provide a tag so that other parts can invalidate if needed.
       * We tag by user email.
       */
      providesTags: (_result, _error, session) =>
        session?.user?.email
          ? [{ type: "UserRole", id: session.user.email }]
          : [],
    }),

    /**
     * getMyBoards
     *
     * Description: Fetches all boards visible to the current user (owned or via team membership).
     * Input: userId: string
     * Returns: BoardWithCounts[] including counts of tasks and team members.
     *
     * This query fetches owned boards and boards accessible via team membership, adding
     * task and member counts, providing 'Board' tags for each board.
     */
    getMyBoards: builder.query<BoardWithCounts[], string>({
      async queryFn(userId) {
        try {
          // 1) Fetch boards owned by user
          const { data: ownedRaw = [], error: ownedErr } = await supabase
            .from("boards")
            .select(
              `
              *,
              owner:users!boards_user_id_fkey(id, name, email)
            `
            )
            .eq("user_id", userId);
          if (ownedErr) throw ownedErr;
          const ownedBoards: Board[] = (ownedRaw as any[]).map((b) => {
            let ownerObj: any = null;
            if (Array.isArray(b.owner) && b.owner.length > 0) {
              ownerObj = b.owner[0];
            } else if (b.owner) {
              ownerObj = b.owner;
            }
            //@ts-ignore
            return {
              id: b.id,
              title: b.title,
              owner_id: b.user_id,
              ownerName: ownerObj?.name,
              ownerEmail: ownerObj?.email,
              columns: [],
              created_at: b.created_at ?? undefined,
              updated_at: b.updated_at ?? undefined,
            } as Board;
          });

          // 2) Fetch boards via team membership
          const { data: memRaw = [], error: memErr } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId);
          if (memErr) throw memErr;
          const teamIds = (memRaw as any[]).map((m) => m.team_id);
          let viaTeamsBoards: Board[] = [];
          if (teamIds.length > 0) {
            // Fetch teams rows to get board_id
            const { data: teamsRaw = [], error: teamsErr } = await supabase
              .from("teams")
              .select("board_id")
              .in("id", teamIds);
            if (teamsErr) throw teamsErr;
            const boardIds = Array.from(
              new Set((teamsRaw as any[]).map((t) => t.board_id))
            );
            if (boardIds.length > 0) {
              const { data: boardsFromTeamsRaw = [], error: bErr } =
                await supabase
                  .from("boards")
                  .select(
                    `
                  *,
                  owner:users!boards_user_id_fkey(id, name, email)
                `
                  )
                  .in("id", boardIds);
              if (bErr) throw bErr;
              viaTeamsBoards = (boardsFromTeamsRaw as any[]).map((b) => {
                let ownerObj: any = null;
                if (Array.isArray(b.owner) && b.owner.length > 0) {
                  ownerObj = b.owner[0];
                } else if (b.owner) {
                  ownerObj = b.owner;
                }
                //@ts-ignore
                return {
                  id: b.id,
                  title: b.title,
                  owner_id: b.user_id,
                  ownerName: ownerObj?.name,
                  ownerEmail: ownerObj?.email,
                  columns: [],
                  created_at: b.created_at ?? undefined,
                  updated_at: b.updated_at ?? undefined,
                } as Board;
              });
            }
          }

          // 3) Merge & dedupe boards
          const allBoards = [...ownedBoards, ...viaTeamsBoards];
          const uniqueMap = new Map<string, Board>();
          allBoards.forEach((b) => uniqueMap.set(b.id, b));
          const uniqueBoards = Array.from(uniqueMap.values());

          // 4) Fetch counts for each board: tasks count & teamMembers count
          const boardsWithCounts: BoardWithCounts[] = await Promise.all(
            uniqueBoards.map(async (b) => {
              // Count tasks
              const { count: taskCountRaw } = await supabase
                .from("tasks")
                .select("id", { count: "exact", head: true })
                .eq("board_id", b.id);
              const taskCount = taskCountRaw ?? 0;

              // Fetch team IDs for this board
              const { data: boardTeamsRaw = [] } = await supabase
                .from("teams")
                .select("id")
                .eq("board_id", b.id);
              const bTeamIds = (boardTeamsRaw as any[]).map((t) => t.id);

              // Count members
              let memberCount = 0;
              if (bTeamIds.length > 0) {
                const { count: memberCountRaw } = await supabase
                  .from("team_members")
                  .select("id", { count: "exact", head: true })
                  .in("team_id", bTeamIds);
                memberCount = memberCountRaw ?? 0;
              }

              return {
                ...b,
                _count: { tasks: taskCount, teamMembers: memberCount },
              };
            })
          );

          return { data: boardsWithCounts };
        } catch (err: any) {
          console.error("[apiSlice.getMyBoards] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result) =>
        result ? result.map((b) => ({ type: "Board" as const, id: b.id })) : [],
    }),

    getMyTeams: builder.query<Team[], string>({
      async queryFn(userId) {
        try {
          // 1. Teams I own:
          const { data: ownedRaw = [], error: ownedErr } = await supabase
            .from("teams")
            .select("*")
            .eq("owner_id", userId);
          if (ownedErr) throw ownedErr;

          // 2. Teams I’m a member of:
          const { data: memberLinks = [], error: linkErr } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId);
          if (linkErr) throw linkErr;

          const teamIds = memberLinks.map((l) => l.team_id);
          let memberRaw: any[] = [];
          if (teamIds.length > 0) {
            const { data, error } = await supabase
              .from("teams")
              .select("*")
              .in("id", teamIds);
            if (error) throw error;
            memberRaw = data || [];
          }

          // 3. Merge & dedupe:
          const map = new Map<string, any>();
          [...ownedRaw, ...memberRaw].forEach((t) => map.set(t.id, t));
          const allTeams = Array.from(map.values());

          // 4. For each team, fetch its members (you can reuse your existing logic):
          const result: Team[] = await Promise.all(
            allTeams.map(async (t) => {
              const { data: membersData = [], error: mErr } = await supabase
                .from("team_members")
                .select(
                  "*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
                )
                .eq("team_id", t.id);
              if (mErr) throw mErr;
              const users = membersData.map((r: any) => {
                const u = Array.isArray(r.user) ? r.user[0] : r.user;
                return {
                  id: r.id,
                  team_id: r.team_id,
                  user_id: r.user_id,
                  created_at: r.created_at,
                  user: {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    image: u.image,
                    role: u.role,
                    created_at: u.created_at,
                  },
                };
              });
              return {
                id: t.id,
                name: t.name,
                board_id: t.board_id,
                owner_id: t.owner_id,
                users,
                created_at: t.created_at,
                updated_at: t.updated_at,
              } as Team;
            })
          );

          return { data: result };
        } catch (err: any) {
          console.error("[apiSlice.getMyTeams] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              { type: "TeamsList", id: "LIST" },
              ...result.map((t) => ({ type: "Team" as const, id: t.id })),
            ]
          : [{ type: "TeamsList", id: "LIST" }],
    }),

    /**
     * getNotifications
     *
     * Description: Fetches all notifications for a specified user.
     * Input: userId: string
     * Returns: Array of notification objects.
     *
     * This query fetches rows from the 'notifications' table for the given user ID,
     * providing a 'Notification' tag for the user.
     */
    getNotifications: builder.query<any[], string>({
      async queryFn(userId) {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
          if (error) throw error;
          return { data: data || [] };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result, _error, userId) =>
        result ? [{ type: "Notification", id: userId }] : [],
    }),

    /**
     * getTaskById
     *
     * Description: Fetches a single task by ID with detailed information.
     * Input: { taskId: string }
     * Returns: TaskDetail object with attachments, comments, assignee, and priority info.
     *
     * This query fetches a task row with joined data from related tables,
     * providing a 'Task' tag for invalidation.
     */
    getTaskById: builder.query<TaskDetail, { taskId: string }>({
      async queryFn({ taskId }) {
        try {
          const { data: taskData, error: te } = await supabase
            .from("tasks")
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
              `
            )
            .eq("id", taskId)
            .single();
          if (te || !taskData) throw te || new Error("Task not found");

          // Flatten assignee
          let assignee: User | null = null;
          if (
            Array.isArray((taskData as any).assignee) &&
            (taskData as any).assignee.length > 0
          ) {
            const u = (taskData as any).assignee[0];
            assignee = {
              id: u.id,
              name: u.name,
              email: u.email,
              image: u.image ?? undefined,
              role: u.role ?? undefined,
              created_at: u.created_at ?? undefined,
            };
          } else if ((taskData as any).assignee) {
            const u = (taskData as any).assignee as any;
            assignee = {
              id: u.id,
              name: u.name,
              email: u.email,
              image: u.image ?? undefined,
              role: u.role ?? undefined,
              created_at: u.created_at ?? undefined,
            };
          }

          // Flatten priority_info
          let priority_info: {
            id: string;
            label: string;
            color: string;
          } | null = null;
          if (
            Array.isArray((taskData as any).priority_data) &&
            (taskData as any).priority_data.length > 0
          ) {
            const p = (taskData as any).priority_data[0];
            priority_info = { id: p.id, label: p.label, color: p.color };
          } else if ((taskData as any).priority_data) {
            const p = (taskData as any).priority_data as any;
            priority_info = { id: p.id, label: p.label, color: p.color };
          }

          // Flatten attachments
          let attachments: Attachment[] = [];
          if (Array.isArray((taskData as any).attachments)) {
            attachments = (taskData as any).attachments.map((a: any) => ({
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

          // Flatten comments
          let comments: TaskDetail["comments"] = [];
          if (Array.isArray((taskData as any).comments)) {
            comments = (taskData as any).comments.map((c: any) => {
              // Flatten author
              let authorObj: any = null;
              if (Array.isArray(c.author) && c.author.length > 0) {
                authorObj = c.author[0];
              } else if (c.author) {
                authorObj = c.author;
              }
              const author = authorObj
                ? {
                    id: authorObj.id,
                    name: authorObj.name,
                    email: authorObj.email,
                    image: authorObj.image ?? undefined,
                  }
                : {
                    id: "",
                    name: "",
                    email: "",
                    image: undefined,
                  };
              return {
                id: c.id,
                task_id: c.task_id,
                user_id: c.user_id,
                content: c.content,
                created_at: c.created_at,
                updated_at: c.updated_at ?? undefined,
                author,
              };
            });
          }

          // Map to TaskDetail type
          const result: TaskDetail = {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description,
            column_id: taskData.column_id,
            board_id: taskData.board_id,
            priority: taskData.priority ?? null,
            user_id: taskData.user_id ?? null,
            order: (taskData as any).sort_order ?? 0,
            completed: taskData.completed,
            created_at: taskData.created_at ?? null,
            updated_at: taskData.updated_at ?? null,
            images: taskData.images ?? null,
            assignee,
            start_date: taskData.start_date ?? null,
            end_date: taskData.end_date ?? null,
            due_date: taskData.due_date ?? null,
            status: taskData.status ?? null,
            priority_info,
            attachments,
            comments,
            imagePreview: (taskData as any).imagePreview ?? null,
            hasUnsavedChanges: false,
          };

          return { data: result };
        } catch (err: any) {
          console.error("[apiSlice.getTaskById] error:", err);
          return {
            error: { status: "CUSTOM_ERROR", error: err.message },
          };
        }
      },
      providesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    /**
     * getTasksWithDates
     *
     * Description: Fetches tasks for a board that have date fields for calendar usage.
     * Input: boardId: string
     * Returns: Task[] with id, title, start_date, end_date, etc.
     *
     * This query fetches tasks with date fields from the 'tasks' table,
     * providing 'TasksWithDates' tags for each task.
     */
    getTasksWithDates: builder.query<Task[], string>({
      async queryFn(boardId) {
        try {
          const { data: rawTasks = [], error } = await supabase
            .from("tasks")
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
              `
            )
            .eq("board_id", boardId);

          if (error) throw error;

          const tasks: Task[] = (rawTasks as any[]).map((t) => {
            // flatten the join
            const assigneeObj: User | undefined = t.users
              ? {
                  id: t.users.id,
                  name: t.users.name,
                  email: t.users.email,
                  image: t.users.image ?? undefined,
                }
              : undefined;

            return {
              id: t.id,
              title: t.title,
              description: t.description ?? "",
              column_id: t.column_id,
              board_id: t.board_id,
              priority: t.priority ?? "",
              user_id: t.user_id ?? undefined,
              order: t.sort_order ?? 0,
              sort_order: t.sort_order ?? 0,
              completed: t.completed,
              created_at: t.created_at ?? undefined,
              updated_at: t.updated_at ?? undefined,
              assignee: assigneeObj,
              start_date: t.start_date ?? undefined,
              end_date: t.end_date ?? undefined,
              due_date: t.due_date ?? undefined,
              status: t.status ?? undefined,
            };
          });

          const filtered = tasks.filter(
            (tk) => tk.start_date || tk.end_date || tk.due_date
          );

          return { data: filtered };
        } catch (err: any) {
          console.error("[apiSlice.getTasksWithDates] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? result.map((t) => ({ type: "TasksWithDates" as const, id: t.id }))
          : [],
    }),

    /**
     * getTeamMembersByBoardId
     *
     * Description: Fetches team members for a given board ID.
     * Input: boardId: string
     * Returns: User[] representing team members.
     *
     * This query fetches team members via team IDs associated with the board,
     * providing 'TeamMember' tags for the board and individual users.
     */
    getTeamMembersByBoardId: builder.query<User[], string>({
      async queryFn(boardId) {
        try {
          // 1) Get all team-IDs for this board:
          const { data: boardTeams = [], error: btErr } = await supabase
            .from("teams")
            .select("id")
            .eq("board_id", boardId);
          if (btErr) throw btErr;

          const teamIds = (boardTeams as any[]).map((t) => t.id);
          if (teamIds.length === 0) {
            return { data: [] };
          }

          // 2) Fetch the team_members → users join:
          const { data: rawData, error: mErr } = await supabase
            .from("team_members")
            .select(
              "user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
            )
            .in("team_id", teamIds);
          if (mErr) throw mErr;

          // 3) Null-safe coalesce to an empty array:
          const raw: any[] = rawData ?? [];

          // 4) Dedupe and map into your User type:
          const map = new Map<string, User>();
          raw.forEach((r) => {
            const u = Array.isArray(r.user) ? r.user[0] : r.user;
            if (u && !map.has(u.id)) {
              map.set(u.id, {
                id: u.id,
                name: u.name,
                email: u.email,
                image: u.image ?? undefined,
                role: u.role ?? undefined,
                created_at: u.created_at ?? undefined,
              });
            }
          });

          return { data: Array.from(map.values()) };
        } catch (err: any) {
          console.error("[apiSlice.getTeamMembersByBoardId] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result, _error, boardId) =>
        result
          ? [
              { type: "TeamMember" as const, id: boardId },
              ...result.map((u) => ({ type: "TeamMember" as const, id: u.id })),
            ]
          : [{ type: "TeamMember", id: boardId }],
    }),

    getBoardsByTeamId: builder.query<Board[], string>({
      async queryFn(teamId) {
        try {
          const { data: links, error: linkErr } = await supabase
            .from("team_boards")
            .select("board_id")
            .eq("team_id", teamId);

          if (linkErr) throw linkErr;

          const boardIds = (links ?? []).map((l) => l.board_id);
          if (!boardIds.length) return { data: [] };

          const { data: boards, error: boardErr } = await supabase
            .from("boards")
            .select("*")
            .in("id", boardIds);

          if (boardErr) throw boardErr;

          return { data: boards ?? [] };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (_result, _error, teamId) => [{ type: "Team", id: teamId }],
    }),

    updateTeamBoards: builder.mutation<
      { teamId: string; boardIds: string[] },
      { teamId: string; boardIds: string[] }
    >({
      async queryFn({ teamId, boardIds }) {
        try {
          // 1. Usuń istniejące powiązania
          const { error: deleteErr } = await supabase
            .from("team_boards")
            .delete()
            .eq("team_id", teamId);
          if (deleteErr) throw deleteErr;

          // 2. Dodaj nowe powiązania
          const inserts = boardIds.map((boardId) => ({
            team_id: teamId,
            board_id: boardId,
          }));

          const { error: insertErr } = await supabase
            .from("team_boards")
            .insert(inserts);

          if (insertErr) throw insertErr;

          return { data: { teamId, boardIds } };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_res, _err, { teamId }) => [
        { type: "Team", id: teamId },
      ],
    }),

    /**
     * getTeams
     *
     * Description: Fetches all teams owned by a user.
     * Input: ownerId: string
     * Returns: Team[] with nested TeamMember[] and user info.
     *
     * This query fetches teams where the owner ID matches, including members,
     * providing 'TeamsList' and 'Team' tags.
     */
    getTeams: builder.query<Team[], string>({
      async queryFn(ownerId) {
        try {
          // 1) Fetch teams where owner_id = ownerId
          const { data: teamsRaw = [], error: teamsErr } = await supabase
            .from("teams")
            .select("*")
            .eq("owner_id", ownerId);
          if (teamsErr) throw teamsErr;
          const teams: Team[] = [];
          for (const t of teamsRaw as any[]) {
            // Fetch members for this team
            const { data: membersRaw = [], error: membersErr } = await supabase
              .from("team_members")
              .select(
                "*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
              )
              .eq("team_id", t.id);
            if (membersErr) throw membersErr;
            const members: TeamMember[] = (membersRaw as any[]).map(
              (r: any) => {
                const u = Array.isArray(r.user) ? r.user[0] : r.user;
                const tm: TeamMember = {
                  id: r.id,
                  team_id: r.team_id,
                  user_id: r.user_id,
                  created_at: r.created_at ?? undefined,
                  user: {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    image: u.image ?? undefined,
                    role: u.role ?? undefined,
                    created_at: u.created_at ?? undefined,
                  },
                };
                return tm;
              }
            );
            teams.push({
              id: t.id,
              name: (t as any).name,
              board_id: (t as any).board_id ?? null,
              owner_id: (t as any).owner_id,
              users: members,
              created_at: t.created_at ?? undefined,
            });
          }
          return { data: teams };
        } catch (err: any) {
          console.error("[apiSlice.getTeams] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              { type: "TeamsList", id: "LIST" },
              ...result.map((team) => ({ type: "Team" as const, id: team.id })),
            ]
          : [{ type: "TeamsList", id: "LIST" }],
    }),

    getUserBoards: builder.query<Board[], string>({
      async queryFn(userId, _queryApi, _extraOptions, _baseFetch) {
        try {
          // 1. boards, gdzie owner_id = userId
          const { data: ownBoards, error: ownErr } = await supabase
            .from("boards")
            .select("id,name,owner_id,created_at")
            .eq("owner_id", userId);
          if (ownErr) {
            console.error(
              "getUserBoards – owned boards error:",
              ownErr.message
            );
          }
          const own = ownBoards || [];

          // 2. team_members dla userId → team_id[]
          const { data: tm, error: tmErr } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId);
          if (tmErr) {
            console.error("getUserBoards – team_members error:", tmErr.message);
          }
          const teamIds = tm?.map((r) => r.team_id) || [];

          // 3. team_boards dla tych teamIds → board_id[]
          let teamBoardIds: string[] = [];
          if (teamIds.length > 0) {
            const { data: tb, error: tbErr } = await supabase
              .from("team_boards")
              .select("board_id")
              .in("team_id", teamIds);
            if (tbErr) {
              console.error(
                "getUserBoards – team_boards error:",
                tbErr.message
              );
            } else {
              teamBoardIds = tb?.map((r) => r.board_id) || [];
            }
          }

          // 4. fetch boardów po tych boardBoardIds
          let teamBoards: any[] = [];
          if (teamBoardIds.length > 0) {
            const { data: tBoardsData, error: tBoardsErr } = await supabase
              .from("boards")
              .select("id,name,owner_id,created_at")
              .in("id", teamBoardIds);
            if (tBoardsErr) {
              console.error(
                "getUserBoards – fetch boards by IDs error:",
                tBoardsErr.message
              );
            } else {
              teamBoards = tBoardsData || [];
            }
          }

          // 5. połącz, bez duplikatów
          const map = new Map<string, Board>();
          own.forEach((b: any) => map.set(b.id, b));
          teamBoards.forEach((b: any) => {
            if (!map.has(b.id)) map.set(b.id, b);
          });
          const result: Board[] = Array.from(map.values());
          return { data: result };
        } catch (err: any) {
          console.error("getUserBoards – unexpected error:", err);
          return { error: { status: 500, data: err.message || err } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Boards" as const, id })),
              { type: "Boards", id: "LIST" },
            ]
          : [{ type: "Boards", id: "LIST" }],
    }),

    getTasksByBoardsAndDate: builder.query<
      Task[],
      { boardIds: string[]; start: string; end: string }
    >({
      async queryFn(arg, _queryApi, _extraOptions, _baseFetch) {
        const { boardIds, start, end } = arg;
        if (!boardIds || boardIds.length === 0) {
          return { data: [] };
        }
        try {
          // Prosty fetch: start_date pomiędzy start a end
          const { data, error } = await supabase
            .from("tasks")
            .select(
              "id,title,start_date,end_date,board_id,priority,color,column_id"
            )
            .in("board_id", boardIds)
            .gte("start_date", start)
            .lte("start_date", end);
          if (error) {
            console.error("getTasksByBoardsAndDate error:", error.message);
            return { error: { status: 400, data: error.message } };
          }
          return { data: data || [] };
        } catch (err: any) {
          console.error("getTasksByBoardsAndDate unexpected:", err);
          return { error: { status: 500, data: err.message || err } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Tasks" as const, id })),
              { type: "Tasks", id: "LIST" },
            ]
          : [{ type: "Tasks", id: "LIST" }],
    }),

    /**
     * getUserRole
     *
     * Description: Fetches the role of a user from the Supabase users table.
     * Input: email: string
     * Returns: UserRole ("OWNER" | "PROJECT_MANAGER" | "MEMBER")
     *
     * This query fetches the role field for a user by email, defaulting to 'MEMBER'
     * if not found, providing a 'UserRole' tag.
     */
    getUserRole: builder.query<UserRole, string>({
      async queryFn(email) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("email", email)
            .single();
          if (error) {
            // default to MEMBER if error or missing
            return { data: "MEMBER" };
          }
          const role = data?.role as UserRole | null;
          return {
            data:
              role === "OWNER" || role === "PROJECT_MANAGER" ? role : "MEMBER",
          };
        } catch (err: any) {
          console.error("[apiSlice.getUserRole] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (_result, _error, email) => [
        { type: "UserRole", id: email },
      ],
    }),

    /**
     * markNotificationRead
     *
     * Description: Marks a notification as read by its ID.
     * Input: { id: string }
     * Returns: Object with the updated notification ID.
     *
     * This mutation updates the 'read' field in the 'notifications' table,
     * invalidating the 'Notification' tag for the ID.
     */
    markNotificationRead: builder.mutation<{ id: string }, { id: string }>({
      async queryFn({ id }) {
        try {
          const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id);
          if (error) throw error;
          return { data: { id } };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Notification", id },
      ],
    }),

    /**
     * removeBoard
     *
     * Description: Removes a board by its ID.
     * Input: { boardId: string }
     * Returns: Object with the deleted board ID.
     *
     * This mutation deletes a row from the 'boards' table, invalidating 'Board' tags
     * for the ID and list.
     */
    removeBoard: builder.mutation<{ id: string }, { boardId: string }>({
      async queryFn({ boardId }) {
        try {
          const { error } = await supabase
            .from("boards")
            .delete()
            .eq("id", boardId);
          if (error) throw error;
          return { data: { id: boardId } };
        } catch (err: any) {
          console.error("[apiSlice.removeBoard] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: "Board", id: boardId },
        { type: "Board", id: "LIST" },
      ],
    }),

    /**
     * removeColumn
     *
     * Description: Removes a column and its associated tasks.
     * Input: { columnId: string }
     * Returns: Object with the deleted column ID.
     *
     * This mutation deletes tasks and the column row from their respective tables,
     * invalidating the 'Column' tag.
     */
    removeColumn: builder.mutation<{ id: string }, { columnId: string }>({
      async queryFn({ columnId }) {
        try {
          // delete tasks in this column first
          await supabase.from("tasks").delete().eq("column_id", columnId);
          const { error } = await supabase
            .from("columns")
            .delete()
            .eq("id", columnId);
          if (error) throw error;
          return { data: { id: columnId } };
        } catch (err: any) {
          console.error("[apiSlice.removeColumn] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /**
     * removeTask
     *
     * Description: Removes a task by its ID.
     * Input: { taskId: string, columnId: string }
     * Returns: Object with the deleted task ID and column ID.
     *
     * This mutation deletes a row from the 'tasks' table, invalidating the 'Column' tag.
     */
    removeTask: builder.mutation<
      { id: string; columnId: string },
      { taskId: string; columnId: string }
    >({
      async queryFn({ taskId, columnId }) {
        try {
          const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", taskId);
          if (error) throw error;
          return { data: { id: taskId, columnId } };
        } catch (err: any) {
          console.error("[apiSlice.removeTask] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /**
     * updateBoardTitle
     *
     * Description: Updates the title of a board.
     * Input: { boardId: string, title: string }
     * Returns: Object with the updated board ID and title.
     *
     * This mutation updates the 'title' field in the 'boards' table,
     * invalidating the 'Board' tag for the ID.
     */
    updateBoardTitle: builder.mutation<
      { id: string; title: string },
      { boardId: string; title: string }
    >({
      async queryFn({ boardId, title }) {
        try {
          const { error } = await supabase
            .from("boards")
            .update({ title })
            .eq("id", boardId);
          if (error) throw error;
          return { data: { id: boardId, title } };
        } catch (err: any) {
          console.error("[apiSlice.updateBoardTitle] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: "Board", id: boardId },
      ],
    }),

    /**
     * updateColumnOrder
     *
     * Description: Updates the order of a column.
     * Input: { columnId: string, order: number }
     * Returns: Object with the updated column ID and order.
     *
     * This mutation updates the 'order' field in the 'columns' table,
     * invalidating the 'Column' and 'Board' tags.
     */
    updateColumnOrder: builder.mutation<
      { id: string; order: number },
      { columnId: string; order: number }
    >({
      async queryFn({ columnId, order }) {
        try {
          const { data, error } = await supabase
            .from("columns")
            .update({ order })
            .eq("id", columnId)
            .select("id, order")
            .single();
          if (error || !data)
            throw error || new Error("Update column order failed");
          return { data };
        } catch (err: any) {
          console.error("[apiSlice.updateColumnOrder] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { columnId }) => [
        { type: "Column", id: columnId },
        // optionally invalidate board list if needed
        { type: "Board", id: "LIST" },
      ],
    }),

    /**
     * updateColumnTitle
     *
     * Description: Updates the title of a column.
     * Input: { columnId: string, title: string }
     * Returns: Object with the updated column ID and title.
     *
     * This mutation updates the 'title' field in the 'columns' table,
     * invalidating the 'Column' tag.
     */
    updateColumnTitle: builder.mutation<
      { id: string; title: string },
      { columnId: string; title: string }
    >({
      async queryFn({ columnId, title }) {
        try {
          const { error } = await supabase
            .from("columns")
            .update({ title })
            .eq("id", columnId);
          if (error) throw error;
          return { data: { id: columnId, title } };
        } catch (err: any) {
          console.error("[apiSlice.updateColumnTitle] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /**
     * updateTask
     *
     * Description: Updates a task partially, mapping 'order' to 'sort_order' if provided.
     * Input: { taskId: string, data: Partial<TaskDetail> }
     * Returns: Task object with updated fields.
     *
     * This mutation updates fields in the 'tasks' table, invalidating 'Task', 'Column',
     * and 'TasksWithDates' tags as needed.
     */
    updateTask: builder.mutation<
      Task,
      { taskId: string; data: Partial<TaskDetail> }
    >({
      async queryFn({ taskId, data }) {
        try {
          const dbPayload: any = { ...data };
          if (dbPayload.order !== undefined) {
            dbPayload.sort_order = dbPayload.order;
            delete dbPayload.order;
          }
          const { data: updated, error } = await supabase
            .from("tasks")
            .update(dbPayload)
            .eq("id", taskId)
            .select("*")
            .single();
          if (error || !updated) throw error || new Error("Update failed");
          //@ts-ignore
          const mapped: Task = {
            id: updated.id,
            title: updated.title,
            description: updated.description,
            column_id: updated.column_id,
            board_id: updated.board_id,
            priority: updated.priority,
            user_id: updated.user_id ?? undefined,
            order: updated.sort_order ?? 0,
            completed: updated.completed,
            created_at: updated.created_at ?? undefined,
            updated_at: updated.updated_at ?? undefined,
            images: updated.images ?? undefined,
            assignee: undefined,
            start_date: updated.start_date ?? undefined,
            end_date: updated.end_date ?? undefined,
            due_date: updated.due_date ?? undefined,
            status: updated.status ?? undefined,
          };
          return { data: mapped };
        } catch (err: any) {
          console.error("[apiSlice.updateTask] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      //@ts-ignore
      invalidatesTags: (_result, _error, { taskId, data }) => {
        const tags = [{ type: "Task", id: taskId }];
        if (data.column_id) {
          tags.push({ type: "Column", id: data.column_id });
        }
        if (data.start_date || data.end_date) {
          tags.push({ type: "TasksWithDates", id: taskId });
        }
        return tags;
      },
    }),

    /**
     * updateTaskCompletion
     *
     * Description: Updates the completion status of a task.
     * Input: { taskId: string, completed: boolean }
     * Returns: void
     *
     * This mutation updates the 'completed' field in the 'tasks' table,
     * invalidating the 'Task' tag.
     */
    updateTaskCompletion: builder.mutation<
      void,
      { taskId: string; completed: boolean }
    >({
      async queryFn({ taskId, completed }) {
        try {
          const { error } = await supabase
            .from("tasks")
            .update({ completed })
            .eq("id", taskId);
          if (error) throw error;
          return { data: undefined };
        } catch (err: any) {
          console.error("[apiSlice.updateTaskCompletion] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    /**
     * updateTaskDates
     *
     * Description: Updates the start_date and end_date of a task.
     * Input: { taskId: string, start_date: string | null, end_date: string | null }
     * Returns: void
     *
     * This mutation updates the 'start_date' and 'end_date' fields in the 'tasks' table,
     * invalidating 'Task' and 'TasksWithDates' tags.
     */
    updateTaskDates: builder.mutation<
      void,
      { taskId: string; start_date: string | null; end_date: string | null }
    >({
      async queryFn({ taskId, start_date, end_date }) {
        try {
          const { error } = await supabase
            .from("tasks")
            .update({ start_date, end_date })
            .eq("id", taskId);
          if (error) throw error;
          return { data: undefined };
        } catch (err: any) {
          console.error("[apiSlice.updateTaskDates] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "TasksWithDates", id: taskId },
      ],
    }),

    /**
     * updateTeam
     *
     * Description: Updates an existing team with name, board_id, and members.
     * Input: { id: string, name?: string, board_id?: string, members: string[], owner_id: string }
     * Returns: Team object with updated fields and members.
     *
     * This mutation updates team fields and manages member additions/removals,
     * invalidating 'TeamsList' and 'Team' tags.
     */
    updateTeam: builder.mutation<
      Team,
      {
        id: string;
        name?: string;
        board_id?: string;
        members: string[];
        owner_id: string;
      }
    >({
      async queryFn({ id, name, board_id, members, owner_id }) {
        try {
          // Update team fields
          const updPayload: any = {};
          if (name !== undefined) updPayload.name = name;
          if (board_id !== undefined) updPayload.board_id = board_id;
          const { data: updatedTeam, error: updErr } = await supabase
            .from("teams")
            .update(updPayload)
            .eq("id", id)
            .select("*")
            .single();
          if (updErr || !updatedTeam)
            throw updErr || new Error("Failed to update team");

          // Fetch existing members
          const { data: existingMembersRaw = [], error: existErr } =
            await supabase.from("team_members").select("*").eq("team_id", id);
          if (existErr) throw existErr;
          const existingUserIds = (existingMembersRaw as any[]).map(
            (r) => r.user_id
          );
          // Ensure owner present
          const uniqueMembers = Array.from(new Set([owner_id, ...members]));
          // Remove members no longer present
          const toRemove = existingUserIds.filter(
            (uid) => !uniqueMembers.includes(uid)
          );
          if (toRemove.length > 0) {
            const { error: delErr } = await supabase
              .from("team_members")
              .delete()
              .eq("team_id", id)
              .in("user_id", toRemove);
            if (delErr) throw delErr;
          }
          // Add new members
          const toAdd = uniqueMembers.filter(
            (uid) => !existingUserIds.includes(uid)
          );
          if (toAdd.length > 0) {
            const inserts = toAdd.map((userId) => ({
              team_id: id,
              user_id: userId,
            }));
            const { data: insertedMembers = [], error: insertErr } =
              await supabase
                .from("team_members")
                .insert(inserts)
                .select(
                  "*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
                );
            if (insertErr) throw insertErr;
          }
          // Fetch final members list
          const { data: finalMembersRaw = [], error: finalErr } = await supabase
            .from("team_members")
            .select(
              "*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
            )
            .eq("team_id", id);
          if (finalErr) throw finalErr;
          const teamMembers: TeamMember[] = (finalMembersRaw as any[]).map(
            (r: any) => {
              const u = Array.isArray(r.user) ? r.user[0] : r.user;
              return {
                id: r.id,
                team_id: r.team_id,
                user_id: r.user_id,
                created_at: r.created_at ?? undefined,
                user: {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  image: u.image ?? undefined,
                  role: u.role ?? undefined,
                  created_at: u.created_at ?? undefined,
                },
              };
            }
          );
          const resultTeam: Team = {
            id: updatedTeam.id,
            name: updatedTeam.name,
            board_id: updatedTeam.board_id ?? null,
            owner_id: updatedTeam.owner_id,
            users: teamMembers,
            created_at: updatedTeam.created_at ?? undefined,
          };
          return { data: resultTeam };
        } catch (err: any) {
          console.error("[apiSlice.updateTeam] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (result, _error, _arg) =>
        [
          { type: "TeamsList", id: "LIST" },
          result ? { type: "Team" as const, id: result.id } : null,
        ].filter(Boolean) as any,
    }),

    /**
     * uploadAttachment
     *
     * Description: Uploads an attachment for a task to Supabase Storage and database.
     * Input: { file: File, taskId: string, userId: string }
     * Returns: Attachment object representing the uploaded file.
     *
     * This mutation uploads a file to Supabase Storage and inserts a record into
     * 'task_attachments', though it currently invalidates no tags.
     */
    uploadAttachment: builder.mutation<
      Attachment,
      { file: File; taskId: string; userId: string }
    >({
      async queryFn({ file, taskId, userId }) {
        try {
          // Upload file to Supabase Storage
          const ext = file.name.split(".").pop();
          const path = `${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("attachments")
            .upload(path, file);
          if (upErr) throw upErr;
          // Insert into task_attachments table
          const { data, error: dbErr } = await supabase
            .from("task_attachments")
            .insert({
              task_id: taskId,
              file_name: file.name,
              file_path: path,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: userId,
            })
            .select("*")
            .single();
          if (dbErr || !data)
            throw dbErr || new Error("Attachment insert failed");
          return { data };
        } catch (err: any) {
          console.error("[apiSlice.uploadAttachment] error:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: () => [],
    }),
  }),
});

/**
 * Export hooks for each endpoint.
 * These hooks allow components to use the defined queries and mutations.
 */
export const {
  useAddBoardMutation,
  useAddBoardTemplateMutation,
  useAddColumnMutation,
  useAddNotificationMutation,
  useAddStarterTaskMutation,
  useAddTaskMutation,
  useAddTeamMutation,
  useCreateBoardFromTemplateMutation,
  useDeleteNotificationMutation,
  useDeleteTeamMutation,
  useGetBoardQuery,
  useGetCurrentUserQuery,
  useGetMyBoardsQuery,
  useGetNotificationsQuery,
  useGetTaskByIdQuery,
  useGetTasksWithDatesQuery,
  useGetTeamMembersByBoardIdQuery,
  useGetTeamsQuery,
  useGetUserRoleQuery,
  useMarkNotificationReadMutation,
  useRemoveBoardMutation,
  useRemoveColumnMutation,
  useRemoveTaskMutation,
  useUpdateBoardTitleMutation,
  useUpdateColumnOrderMutation,
  useUpdateColumnTitleMutation,
  useUpdateTaskMutation,
  useUpdateTaskCompletionMutation,
  useUpdateTaskDatesMutation,
  useUpdateTeamMutation,
  useUploadAttachmentMutation,
  useGetBoardsByTeamIdQuery,
  useUpdateTeamBoardsMutation,
  useGetMyTeamsQuery,
  useGetUserBoardsQuery,
  useGetTasksByBoardsAndDateQuery,
} = apiSlice;

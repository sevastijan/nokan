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
 */
export type UserRole = "OWNER" | "PROJECT_MANAGER" | "MEMBER";

/**
 * BoardWithCounts extends Board by adding counts of tasks, team members, etc.
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
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(), // we use manual async queryFn calls to Supabase
  tagTypes: [
    "Board",
    "Column",
    "Task",
    "TeamMember",
    "UserRole",
    "TeamsList",
    "Team",
    "TasksWithDates",
  ],
  endpoints: (builder) => ({
    /**
     * 1) Fetch or create current user row in Supabase based on NextAuth session.
     *    Input: NextAuth Session object.
     *    Returns: User row from Supabase (with at least id, name, email, image, role, etc.).
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
     * 2) Fetch a single task by ID, returning TaskDetail (with attachments, comments, assignee, priority_info, etc.)
     *    Input: { taskId: string }
     *    Returns: TaskDetail
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
     * 3) Fetch a full board by ID, including its columns and tasks (with assignee flattening).
     *    Input: boardId: string
     *    Returns: Board object with columns: Column[] and tasks flattened inside.
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
     * 4) Update column order
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
     * 5) Add new board
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
     * 6) Remove board by ID
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
     * 7) Add new task: maps sort_order = 0 initially.
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
     * 8) Update board title
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
     * 9) Remove task by ID
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
     * 10) Add a column to a board
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
     * 11) Remove column (and its tasks)
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
     * 12) Update column title
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
     * 13) Upload attachment for a task
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

    /**
     * 14) Update task start_date and end_date
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
     * 15) Update task completion status
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
     * 16) Update a task partially. Map `order` → `sort_order` if provided.
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
     * 17) Fetch boards visible to current user (owned + via team membership).
     *     Input: userId: string
     *     Returns: BoardWithCounts[] including counts of tasks and teamMembers.
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
            return {
              id: b.id,
              title: b.title,
              user_id: b.user_id,
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
                return {
                  id: b.id,
                  title: b.title,
                  user_id: b.user_id,
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

    /**
     * 17) Fetch user role from Supabase users table.
     *     Input: email string
     *     Returns: UserRole ("OWNER" | "PROJECT_MANAGER" | "MEMBER")
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
     * 18) Fetch team members (User[]) for a given boardId.
     *     Input: boardId: string
     */
    getTeamMembersByBoardId: builder.query<User[], string>({
      async queryFn(boardId) {
        try {
          // First get team IDs linked to this board
          const { data: boardTeams = [], error: btErr } = await supabase
            .from("teams")
            .select("id")
            .eq("board_id", boardId);
          if (btErr) throw btErr;
          const teamIds = (boardTeams as any[]).map((t) => t.id);
          if (teamIds.length === 0) {
            return { data: [] };
          }
          // Now fetch team_members join users
          const { data: raw = [], error: mErr } = await supabase
            .from("team_members")
            .select(
              "user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)"
            )
            .in("team_id", teamIds);
          if (mErr) throw mErr;
          const map = new Map<string, User>();
          raw.forEach((r: any) => {
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
              ...result.map((u) => ({
                type: "TeamMember" as const,
                id: u.id!,
              })),
            ]
          : [{ type: "TeamMember", id: boardId }],
    }),

    /**
     * 19) Fetch all teams owned by a user.
     *     Input: ownerId: string
     *     Returns: Team[] with nested TeamMember[] & user.
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

    /**
     * 20) Add a new team (with members).
     *     Input: { name, owner_id, board_id?, members: string[] }
     *     Returns: Team with nested TeamMember[] & user info.
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
     * 21) Update existing team: name, board_id, members list.
     *     Input: { id, name?, board_id?, members: string[], owner_id }
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
     * 22) Delete team (and its team_members)
     *     Input: teamId: string
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
     * 23) Create a new board from a template:
     *     Input: { title, templateId, user_id }
     *     Steps:
     *       1) Insert board row
     *       2) Fetch template_columns by templateId
     *       3) Insert columns into new board preserving order
     *       4) Fetch inserted columns
     *       5) Fetch ownerName/email if needed
     *     Returns: Board with columns (empty tasks).
     */
    createBoardFromTemplate: builder.mutation<
      Board,
      { title: string; templateId: string; user_id: string }
    >({
      async queryFn({ title, templateId, user_id }) {
        try {
          // 1) Insert board
          const { data: newBoard, error: boardErr } = await supabase
            .from("boards")
            .insert({ title, user_id })
            .select("*")
            .single();
          if (boardErr || !newBoard)
            throw boardErr || new Error("Failed to create board");
          const boardId = newBoard.id;

          // 2) Fetch template columns
          const { data: templateCols = [], error: templateErr } = await supabase
            .from("template_columns")
            .select("*")
            .eq("template_id", templateId)
            .order("order", { ascending: true });
          if (templateErr) throw templateErr;

          // 3) Insert columns for new board
          const colsToInsert = (templateCols as any[]).map((col) => ({
            title: col.title,
            order: col.order,
            board_id: boardId,
          }));
          if (colsToInsert.length > 0) {
            const { error: insertColsErr } = await supabase
              .from("columns")
              .insert(colsToInsert);
            if (insertColsErr) throw insertColsErr;
          }

          // 4) Fetch inserted columns
          const { data: colsInserted = [], error: colsFetchErr } =
            await supabase
              .from("columns")
              .select("*")
              .eq("board_id", boardId)
              .order("order", { ascending: true });
          if (colsFetchErr) throw colsFetchErr;

          // 5) Optionally fetch owner info
          const { data: ownerDataArr = [], error: ownerErr } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", user_id);
          let ownerName: string | undefined = undefined;
          let ownerEmailFetched: string | undefined = undefined;
          if (!ownerErr && ownerDataArr.length > 0) {
            ownerName = ownerDataArr[0].name;
            ownerEmailFetched = ownerDataArr[0].email;
          }

          // Build result Board
          const resultBoard: Board = {
            id: newBoard.id,
            title: newBoard.title,
            user_id: newBoard.user_id,
            ownerName,
            ownerEmail: ownerEmailFetched,
            columns: (colsInserted as any[]).map((c: any) => ({
              id: c.id,
              boardId: c.board_id,
              title: c.title,
              order: c.order,
              tasks: [],
            })),
            created_at: newBoard.created_at ?? undefined,
            updated_at: newBoard.updated_at ?? undefined,
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
     * 24) New endpoint: Fetch tasks for a board that have date fields (start_date or end_date),
     *     for calendar usage.
     *     Input: boardId: string
     *     Returns: Task[] (with at least id, title, start_date, end_date, etc.)
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
              description: t.description,
              column_id: t.column_id,
              board_id: t.board_id,
              priority: t.priority,
              user_id: t.user_id ?? undefined,
              order: t.sort_order ?? 0,
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
  }),
});

/**
 * Export hooks for each endpoint.
 */
export const {
  useGetCurrentUserQuery,
  useGetTaskByIdQuery,
  useGetBoardQuery,
  useAddBoardMutation,
  useRemoveBoardMutation,
  useAddTaskMutation,
  useUpdateBoardTitleMutation,
  useUpdateTaskMutation,
  useRemoveTaskMutation,
  useCreateBoardFromTemplateMutation,
  useGetTeamMembersByBoardIdQuery,
  useAddColumnMutation,
  useRemoveColumnMutation,
  useUpdateColumnTitleMutation,
  useUploadAttachmentMutation,
  useUpdateTaskDatesMutation,
  useUpdateTaskCompletionMutation,
  useGetMyBoardsQuery,
  useUpdateColumnOrderMutation,
  useGetUserRoleQuery,
  useGetTeamsQuery,
  useAddTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetTasksWithDatesQuery,
} = apiSlice;

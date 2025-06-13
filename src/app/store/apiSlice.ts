// src/app/store/apiSlice.ts

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "@/app/lib/supabase";
import { Session } from "next-auth";
import {
  User,
  Task,
  Column,
  Board,
  TaskDetail,
  Attachment,
  TeamMember as GlobalTeamMember,
} from "@/app/types/globalTypes";

export type UserRole = "OWNER" | "PROJECT_MANAGER" | "MEMBER";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Board", "Column", "Task", "TeamMember", "UserRole"],
  endpoints: (builder) => ({
    /** Fetch current user based on NextAuth session */
    getCurrentUser: builder.query<User, Session>({
      async queryFn(session) {
        try {
          const { fetchOrCreateUserFromSession } = await import(
            "@/app/lib/api"
          );
          const user = await fetchOrCreateUserFromSession(session);
          if (!user) throw new Error("User not found");
          return { data: user };
        } catch (err: any) {
          return {
            error: { status: "CUSTOM_ERROR", error: err.message },
          };
        }
      },
    }),

    /** Fetch a single task by its ID */
    getTaskById: builder.query<TaskDetail, { taskId: string }>({
      async queryFn({ taskId }) {
        try {
          const { data: taskData, error: taskError } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", taskId)
            .single();
          if (taskError || !taskData)
            throw taskError || new Error("Task not found");

          // assignee
          let assignee = null;
          if (taskData.user_id) {
            const { data: u, error: ue } = await supabase
              .from("users")
              .select("id, name, email, image, created_at")
              .eq("id", taskData.user_id)
              .single();
            if (!ue && u) assignee = u;
          }

          // priority info
          let priority_info = null;
          if (taskData.priority) {
            const { data: pr, error: pe } = await supabase
              .from("priorities")
              .select("id, label, color")
              .eq("id", taskData.priority)
              .single();
            if (!pe && pr) priority_info = pr;
          }

          // attachments
          const { data: attachments = [] } = await supabase
            .from("task_attachments")
            .select("*")
            .eq("task_id", taskId);

          // comments
          const { data: comments = [] } = await supabase
            .from("task_comments")
            .select("*, author:users(id, name, email, image)")
            .eq("task_id", taskId)
            .order("created_at", { ascending: true });

          const detail: TaskDetail = {
            ...taskData,
            assignee,
            priority_info,
            attachments,
            comments,
          };

          return { data: detail };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (_r, _e, { taskId }) => [{ type: "Task", id: taskId }],
    }),

    /** Fetch board + columns + tasks */
    getBoard: builder.query<Board, string>({
      async queryFn(boardId) {
        try {
          const { data: board, error: be } = await supabase
            .from("boards")
            .select("*")
            .eq("id", boardId)
            .single();
          if (be || !board) throw be || new Error("Board not found");

          const { data: colsRaw = [], error: ce } = await supabase
            .from("columns")
            .select("*, tasks:tasks(*)")
            .eq("board_id", boardId)
            .order("order", { ascending: true });
          if (ce) throw ce;

          const formatted: Board = {
            ...board,
            columns: colsRaw.map((c: any) => ({
              id: c.id,
              boardId: c.board_id,
              title: c.title,
              order: c.order,
              tasks: Array.isArray(c.tasks) ? c.tasks : [],
            })),
          };

          return { data: formatted };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result, _e, boardId) => [
        { type: "Board", id: boardId },
        ...(result?.columns ?? []).map((col) => ({
          type: "Column" as const,
          id: col.id,
        })),
      ],
    }),

    /** Add new task */
    addTask: builder.mutation<
      Task,
      Partial<TaskDetail> & { column_id: string }
    >({
      async queryFn({ column_id, ...rest }) {
        try {
          const insertData = { ...rest, column_id, completed: false, order: 0 };
          const { data, error } = await supabase
            .from("tasks")
            .insert(insertData)
            .select("*")
            .single();
          if (error) throw error;
          return { data };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { column_id }) => [
        { type: "Column", id: column_id },
      ],
    }),

    /** Update board title */
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
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { boardId }) => [
        { type: "Board", id: boardId },
      ],
    }),

    /** Update task */
    updateTask: builder.mutation<
      Task,
      { taskId: string; data: Partial<TaskDetail> }
    >({
      async queryFn({ taskId, data }) {
        try {
          const { data: updated, error } = await supabase
            .from("tasks")
            .update(data)
            .eq("id", taskId)
            .select("*")
            .single();
          if (error) throw error;
          return { data: updated };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "Task", id: taskId }],
    }),

    /** Remove task */
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
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /** Add column */
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
          if (error) throw error;
          return { data };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { board_id }) => [
        { type: "Board", id: board_id },
      ],
    }),

    /** Remove column */
    removeColumn: builder.mutation<{ id: string }, { columnId: string }>({
      async queryFn({ columnId }) {
        try {
          await supabase.from("tasks").delete().eq("column_id", columnId);
          const { error } = await supabase
            .from("columns")
            .delete()
            .eq("id", columnId);
          if (error) throw error;
          return { data: { id: columnId } };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /** Update column title */
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
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_r, _e, { columnId }) => [
        { type: "Column", id: columnId },
      ],
    }),

    /** Upload attachment */
    uploadAttachment: builder.mutation<
      Attachment,
      { file: File; taskId: string; userId: string }
    >({
      async queryFn({ file, taskId, userId }) {
        try {
          const ext = file.name.split(".").pop();
          const path = `${Date.now()}.${ext}`;
          const { error: upErr } = await supabase
            .from("attachments")
            .upload(path, file);
          if (upErr) throw upErr;
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
          if (dbErr) throw dbErr;
          return { data };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      invalidatesTags: () => [],
    }),

    /** Update task dates */
    updateTaskDates: builder.mutation<
      void,
      { taskId: string; start_date: string | null; end_date: string | null }
    >({
      async queryFn({ taskId, start_date, end_date }) {
        const { error } = await supabase
          .from("tasks")
          .update({ start_date, end_date })
          .eq("id", taskId);
        if (error) return { error };
        return { data: undefined };
      },
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "Task", id: taskId }],
    }),

    /** Update task completion */
    updateTaskCompletion: builder.mutation<
      void,
      { taskId: string; completed: boolean }
    >({
      async queryFn({ taskId, completed }) {
        const { error } = await supabase
          .from("tasks")
          .update({ completed })
          .eq("id", taskId);
        if (error) return { error };
        return { data: undefined };
      },
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "Task", id: taskId }],
    }),

    /**
     * Fetch team members for a given board (poprawione user[] -> user[0])
     */
    getTeamMembersByBoardId: builder.query<GlobalTeamMember[], string>({
      async queryFn(boardId) {
        try {
          // 1) Pobierz najpierw team_id z board_teams
          const { data: bt, error: btErr } = await supabase
            .from("board_teams")
            .select("team_id")
            .eq("board_id", boardId)
            .maybeSingle(); // <--- używamy maybeSingle()

          if (btErr) throw btErr;
          if (!bt) {
            // nie ma przypisanego teama do tego boarda
            console.log(
              "🛑 [apiSlice] brak wpisu w board_teams dla boardId:",
              boardId
            );
            return { data: [] };
          }

          const teamId = bt.team_id;

          // 2) Pobierz członków z team_members + dane usera
          const { data: membersRaw, error: mErr } = await supabase
            .from("team_members")
            .select(
              "id, team_id, user_id, created_at, user:users(id, name, email, image, role, created_at)"
            )
            .eq("team_id", teamId)
            .not("user_id", "is", null);

          if (mErr) throw mErr;

          // logujemy raw z Supabase przed mapowaniem
          console.log(
            "💡 [apiSlice] raw team_members for teamId",
            teamId,
            membersRaw
          );

          // 3) Mapujemy na GlobalTeamMember
          const mapped: GlobalTeamMember[] = (membersRaw || []).map(
            (m: any) => {
              // Supabase często zwraca m.user jako tablicę
              const uArr = Array.isArray(m.user) ? m.user : [m.user];
              const u = uArr[0] || {};

              return {
                id: m.id,
                team_id: m.team_id,
                user_id: m.user_id,
                created_at: m.created_at,
                user: {
                  id: u.id,
                  name: u.name ?? "",
                  email: u.email ?? "",
                  image: u.image ?? undefined,
                  role: u.role ?? undefined,
                  created_at: u.created_at ?? undefined,
                },
                // Dodatkowe pola, jeśli potrzebujesz:
                name: u.name ?? "",
                email: u.email ?? "",
                image: u.image ?? undefined,
                joined_at: m.created_at,
              } as GlobalTeamMember;
            }
          );

          // logujemy wynik mapowania
          console.log(
            "🧩 [apiSlice] mapped teamMembers for board",
            boardId,
            mapped
          );

          return { data: mapped };
        } catch (err: any) {
          return {
            error: { status: "CUSTOM_ERROR", error: err.message },
          };
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
          : [{ type: "TeamMember" as const, id: boardId }],
    }),
    /** Fetch plain users for board */
    getBoardUsers: builder.query<User[], string>({
      async queryFn(boardId) {
        try {
          const { data: bt, error: btErr } = await supabase
            .from("board_teams")
            .select("team_id")
            .eq("board_id", boardId)
            .maybeSingle();
          if (btErr) throw btErr;
          if (!bt) return { data: [] };

          const teamId = bt.team_id;
          const { data: membersRaw, error: mErr } = await supabase
            .from("team_members")
            .select("user:users(id, name, email, image)")
            .eq("team_id", teamId)
            .not("user_id", "is", null);
          if (mErr) throw mErr;

          const users: User[] = (membersRaw || [])
            .flatMap((r: any) => (Array.isArray(r.user) ? r.user : [r.user]))
            .filter(Boolean)
            .map((u: any) => ({
              id: u.id,
              name: u.name ?? "",
              email: u.email ?? "",
              image: u.image ?? undefined,
            }));

          return { data: users };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (result, _err, boardId) =>
        result
          ? [
              { type: "TeamMember" as const, id: boardId },
              ...result.map((u) => ({
                type: "TeamMember" as const,
                id: u.id,
              })),
            ]
          : [{ type: "TeamMember" as const, id: boardId }],
    }),

    /** Fetch user role by email */
    getUserRole: builder.query<UserRole, string>({
      async queryFn(email) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("email", email)
            .single();
          if (error) {
            console.error("Error fetching user role:", error);
            return { data: "MEMBER" };
          }
          const rv = data?.role as string | null;
          return {
            data:
              rv === "OWNER" || rv === "PROJECT_MANAGER" || rv === "MEMBER"
                ? rv
                : "MEMBER",
          };
        } catch (err: any) {
          console.error("Exception in getUserRole:", err);
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
      providesTags: (_r, _e, email) => [{ type: "UserRole", id: email }],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useGetTaskByIdQuery,
  useGetBoardQuery,
  useAddTaskMutation,
  useUpdateBoardTitleMutation,
  useUpdateTaskMutation,
  useRemoveTaskMutation,
  useAddColumnMutation,
  useRemoveColumnMutation,
  useUpdateColumnTitleMutation,
  useUploadAttachmentMutation,
  useUpdateTaskDatesMutation,
  useUpdateTaskCompletionMutation,
  useGetTeamMembersByBoardIdQuery,
  useGetBoardUsersQuery,
  useGetUserRoleQuery,
} = apiSlice;

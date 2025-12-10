// src/app/store/slices/calendarApiSlice.ts

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSupabase } from "@/app/lib/supabase";
import type { Board, TaskDetail, Column, User } from "@/app/types/globalTypes";

/**
 * API slice for Calendar: fetching user boards, columns, tasks in date range, team members.
 */
export const calendarApi = createApi({
  reducerPath: "calendarApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["UserBoards", "CalendarTasks", "TeamMembers", "BoardColumns"],
  endpoints: (builder) => ({
    /**
     * Fetch boards the user belongs to OR which the user personally owns.
     * Additionally, if user has no teams, include boards on which user created tasks before.
     *
     * Steps:
     *  1. Query team_members for given userId to get team IDs.
     *  2. Query team_boards for those team IDs to get board IDs.
     *  3. Query boards table with those board IDs to fetch {id, title}.
     *  4. Query personal boards where user_id = userId.
     *  5. If no teams found, also query tasks table for board_ids where user_id = userId, fetch those boards.
     *  6. Merge all lists uniquely and return.
     *
     * @param userId - Supabase user ID.
     * @returns Array of Board ({ id, title }).
     */
    getUserBoards: builder.query<Board[], string>({
      async queryFn(userId) {
        try {
          if (!userId) {
            return { data: [] };
          }
          // 1) Fetch team_members rows for this user
          const { data: tmRows, error: tmError } = await getSupabase()
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId);
          if (tmError) {
            return {
              error: { status: tmError.code ?? 400, data: tmError.message },
            };
          }
          const teamIds = tmRows
            ?.map((r) => r.team_id)
            .filter(Boolean) as string[];

          let boardsFromTeam: Board[] = [];
          // 2) Fetch team_boards entries for those team IDs
          if (teamIds.length) {
            const { data: tbRows, error: tbError } = await getSupabase()
              .from("team_boards")
              .select("board_id")
              .in("team_id", teamIds);
            if (tbError) {
              return {
                error: { status: tbError.code ?? 400, data: tbError.message },
              };
            }
            const teamBoardIds = Array.from(
              new Set(tbRows?.map((r) => r.board_id).filter(Boolean))
            );
            if (teamBoardIds.length) {
              const { data: boardsData, error: bError } = await getSupabase()
                .from("boards")
                .select("id, title")
                .in("id", teamBoardIds);
              if (bError) {
                return {
                  error: { status: bError.code ?? 400, data: bError.message },
                };
              }
              boardsFromTeam = (boardsData as Board[]) || [];
            }
          }

          // 3) Fetch personal boards: where user_id = userId
          let personalBoards: Board[] = [];
          const { data: personalData, error: pError } = await getSupabase()
            .from("boards")
            .select("id, title")
            .eq("user_id", userId);
          if (pError) {
            return {
              error: { status: pError.code ?? 400, data: pError.message },
            };
          }
          personalBoards = (personalData as Board[]) || [];

          // 4) If user has no teams (teamIds empty), try fetch boards from tasks history
          let boardsFromTasks: Board[] = [];
          if (teamIds.length === 0) {
            // Query distinct board_id from tasks where user_id = userId
            const { data: taskRows, error: taskError } = await getSupabase()
              .from("tasks")
              .select("board_id")
              .eq("user_id", userId);
            if (taskError) {
              // Jeżeli błąd podczas pobierania zadań, ignorujemy tę ścieżkę, ale nie przerywamy całości
              console.warn(
                "[getUserBoards] Could not fetch task-based boards:",
                taskError.message
              );
            } else if (taskRows && taskRows.length) {
              const taskBoardIds = Array.from(
                new Set(taskRows.map((r) => r.board_id).filter(Boolean))
              );
              if (taskBoardIds.length) {
                const { data: boardsData2, error: bError2 } = await getSupabase()
                  .from("boards")
                  .select("id, title")
                  .in("id", taskBoardIds);
                if (bError2) {
                  console.warn(
                    "[getUserBoards] Could not fetch boards from taskBoardIds:",
                    bError2.message
                  );
                } else {
                  boardsFromTasks = (boardsData2 as Board[]) || [];
                }
              }
            }
          }

          // 5) Merge all lists uniquely by id
          const boardMap = new Map<string, Board>();
          for (const b of boardsFromTeam) {
            if (b.id) boardMap.set(b.id, b);
          }
          for (const b of personalBoards) {
            if (b.id) boardMap.set(b.id, b);
          }
          for (const b of boardsFromTasks) {
            if (b.id) boardMap.set(b.id, b);
          }
          const resultBoards = Array.from(boardMap.values());

          return { data: resultBoards };
        } catch (err: any) {
          return { error: { status: 500, data: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "UserBoards" as const, id })),
              { type: "UserBoards" as const, id: "LIST" },
            ]
          : [{ type: "UserBoards" as const, id: "LIST" }],
    }),

    /**
     * Fetch columns for a given board ID.
     * Maps snake_case fields from Supabase to camelCase Column interface.
     *
     * @param boardId - ID of the board.
     * @returns Column[] with fields id, boardId, title, order, tasks: [].
     */
    getColumnsByBoardId: builder.query<Column[], string>({
      async queryFn(boardId) {
        try {
          if (!boardId) {
            return { data: [] };
          }
          // Supabase returns snake_case: board_id
          const { data: cols, error } = await getSupabase()
            .from("columns")
            .select("id, title, board_id, order")
            .eq("board_id", boardId)
            .order("order", { ascending: true });
          if (error) {
            return {
              error: { status: error.code ?? 400, data: error.message },
            };
          }
          if (!cols) {
            return { data: [] };
          }
          // Map to Column interface: board_id -> boardId, tasks: []
          const mapped: Column[] = (cols as any[]).map((c) => ({
            id: c.id,
            boardId: c.board_id,
            title: c.title,
            order: c.order,
            tasks: [], // initially empty; fetch tasks separately
          }));
          return { data: mapped };
        } catch (err: any) {
          return { error: { status: 500, data: err.message } };
        }
      },
      providesTags: (result, error, boardId) =>
        result
          ? [
              ...result.map((col) => ({
                type: "BoardColumns" as const,
                id: col.id,
              })),
              { type: "BoardColumns" as const, id: boardId },
            ]
          : [{ type: "BoardColumns" as const, id: boardId }],
    }),

    /**
     * Fetch tasks overlapping a date range across specified board IDs,
     * including assignee data to render avatar/name in calendar.
     * Overlap condition:
     *   (start_date <= end) AND (end_date >= start OR end_date IS NULL).
     *
     * @param param0.boardIds - Array of board IDs.
     * @param param0.start - ISO date string "yyyy-MM-dd" for range start.
     * @param param0.end - ISO date string "yyyy-MM-dd" for range end.
     * @returns Array of TaskDetail (including optional `assignee`).
     */
    getTasksByBoardsAndDate: builder.query<
      TaskDetail[],
      { boardIds: string[]; start: string; end: string }
    >({
      async queryFn({ boardIds, start, end }) {
        try {
          if (!boardIds.length) {
            return { data: [] };
          }
          const orFilter = [
            `and(start_date.lte.${end},end_date.gte.${start})`,
            `and(start_date.lte.${end},end_date.is.null)`,
          ].join(",");
          // Select all fields plus join assignee user:
          // Adjust foreign key alias if needed
          const { data: tasks, error } = await getSupabase()
            .from("tasks")
            .select(
              `
              *,
              assignee:users!tasks_user_id_fkey(id, name, email, image)
            `
            )
            .in("board_id", boardIds)
            .or(orFilter);
          if (error) {
            return {
              error: { status: error.code ?? 400, data: error.message },
            };
          }
          return { data: (tasks as TaskDetail[]) || [] };
        } catch (err: any) {
          return { error: { status: 500, data: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "CalendarTasks" as const,
                id,
              })),
              { type: "CalendarTasks" as const, id: "LIST" },
            ]
          : [{ type: "CalendarTasks" as const, id: "LIST" }],
    }),

    /**
     * Fetch team members for a given board ID (for assignee dropdowns).
     * Steps:
     *  1. Fetch associated teams for this board.
     *  2. Fetch members of those teams.
     *
     * @param boardId - ID of board.
     * @returns Array of { id, name, email, image? }.
     */
    getTeamMembersByBoardId: builder.query<User[], string>({
      async queryFn(boardId) {
        try {
          if (!boardId) {
            return { data: [] };
          }
          // 1) Fetch associated teams for this board
          const { data: tbRows, error: tbError } = await getSupabase()
            .from("team_boards")
            .select("team_id")
            .eq("board_id", boardId);
          if (tbError) {
            return {
              error: { status: tbError.code ?? 400, data: tbError.message },
            };
          }
          const teamIds = tbRows
            ?.map((r) => r.team_id)
            .filter(Boolean) as string[];
          if (!teamIds.length) {
            return { data: [] };
          }
          // 2) Fetch members of those teams
          const { data: tmRows, error: tmError } = await getSupabase()
            .from("team_members")
            .select("user(id, name, email, image)")
            .in("team_id", teamIds);
          if (tmError) {
            return {
              error: { status: tmError.code ?? 400, data: tmError.message },
            };
          }
          const map = new Map<string, User>();
          for (const row of tmRows || []) {
            const u = (row as any).user;
            if (u?.id && !map.has(u.id)) {
              map.set(u.id, u as User);
            }
          }
          return { data: Array.from(map.values()) };
        } catch (err: any) {
          return { error: { status: 500, data: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "TeamMembers" as const, id }))
          : [],
    }),
  }),
});

export const {
  useGetUserBoardsQuery,
  useGetColumnsByBoardIdQuery,
  useGetTasksByBoardsAndDateQuery,
  useGetTeamMembersByBoardIdQuery,
} = calendarApi;

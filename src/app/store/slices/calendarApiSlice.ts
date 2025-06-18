// src/app/store/slices/calendarApiSlice.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "@/app/lib/supabase";
import type { Board, TaskDetail } from "@/app/types/globalTypes";

export const calendarApi = createApi({
  reducerPath: "calendarApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["UserBoards", "CalendarTasks", "TeamMembers"],
  endpoints: (builder) => ({
    /**
     * Fetch boards the user belongs to OR which the user personally owns.
     *
     * Steps:
     * 1. If no userId, return [].
     * 2. Query team_members for given userId to get team IDs.
     * 3. Query team_boards for those team IDs to get board IDs.
     * 4. Query boards table with those board IDs to fetch {id, title}.
     * 5. Query boards table for personal boards where user_id = userId.
     * 6. Merge both lists uniquely and return.
     *
     * @param userId Supabase user ID
     * @returns Array of Board ({ id, title })
     */
    getUserBoards: builder.query<Board[], string>({
      async queryFn(userId) {
        try {
          if (!userId) {
            return { data: [] };
          }

          // 1) Fetch team_members rows for this user
          const { data: tmRows, error: tmError } = await supabase
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

          // 2) Fetch team_boards entries for those team IDs
          let boardsFromTeam: Board[] = [];
          if (teamIds.length) {
            const { data: tbRows, error: tbError } = await supabase
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
              const { data: boardsData, error: bError } = await supabase
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
          //    (adjust 'user_id' if your schema uses a different column name for board owner)
          let personalBoards: Board[] = [];
          const { data: personalData, error: pError } = await supabase
            .from("boards")
            .select("id, title")
            .eq("user_id", userId);
          if (pError) {
            return {
              error: { status: pError.code ?? 400, data: pError.message },
            };
          }
          personalBoards = (personalData as Board[]) || [];

          // 4) Merge both lists uniquely by id
          const boardMap = new Map<string, Board>();
          for (const b of boardsFromTeam) {
            if (b.id) boardMap.set(b.id, b);
          }
          for (const b of personalBoards) {
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
     * Fetch tasks overlapping a date range across specified board IDs,
     * including assignee data to render avatar/name in calendar.
     *
     * Overlap condition:
     *   (start_date <= end) AND (end_date >= start OR end_date IS NULL).
     *
     * We also join the assignee user data so that the calendar can render
     * the assignee’s avatar/name alongside the task bar.
     *
     * @param param.boardIds Array of board IDs
     * @param param.start    ISO date string "yyyy-MM-dd" for range start
     * @param param.end      ISO date string "yyyy-MM-dd" for range end
     * @returns Array of TaskDetail (including optional `assignee`)
     */
    getTasksByBoardsAndDate: builder.query<
      TaskDetail[],
      { boardIds: string[]; start: string; end: string }
    >({
      async queryFn({ boardIds, start, end }) {
        if (!boardIds.length) {
          return { data: [] };
        }
        try {
          // Build OR filter:
          // 1) start_date <= end AND end_date >= start
          // 2) start_date <= end AND end_date IS NULL
          const orFilter = [
            `and(start_date.lte.${end},end_date.gte.${start})`,
            `and(start_date.lte.${end},end_date.is.null)`,
          ].join(",");

          // Select all fields plus join assignee user:
          // Adjust the foreign key alias `tasks_user_id_fkey` if your Supabase schema uses a different name.
          const { data: tasks, error } = await supabase
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
     *
     * Steps:
     * 1. Query team_boards for this boardId to get team IDs.
     * 2. Query team_members for those team IDs to get user info.
     *
     * @param boardId Board ID
     * @returns Array of { id, name, email }
     */
    getTeamMembersByBoardId: builder.query<
      { id: string; name: string; email: string }[],
      string
    >({
      async queryFn(boardId) {
        if (!boardId) {
          return { data: [] };
        }
        try {
          // 1) Fetch associated teams for this board
          const { data: tbRows, error: tbError } = await supabase
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
          const { data: tmRows, error: tmError } = await supabase
            .from("team_members")
            .select("user(id, name, email)")
            .in("team_id", teamIds);
          if (tmError) {
            return {
              error: { status: tmError.code ?? 400, data: tmError.message },
            };
          }
          const map = new Map<
            string,
            { id: string; name: string; email: string }
          >();
          for (const row of tmRows || []) {
            const u = (row as any).user;
            if (u?.id && !map.has(u.id)) {
              map.set(u.id, { id: u.id, name: u.name, email: u.email });
            }
          }
          const members = Array.from(map.values());
          return { data: members };
        } catch (err: any) {
          return { error: { status: 500, data: err.message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TeamMembers" as const, id })),
              { type: "TeamMembers" as const, id: "LIST" },
            ]
          : [{ type: "TeamMembers" as const, id: "LIST" }],
    }),
  }),
});

export const {
  useGetUserBoardsQuery,
  useGetTasksByBoardsAndDateQuery,
  useGetTeamMembersByBoardIdQuery,
} = calendarApi;

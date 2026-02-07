import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSupabase } from '@/app/lib/supabase';
import type { Board, Column, User } from '@/app/types/globalTypes';

export interface CalendarTask {
     id: string;
     title: string | null;
     description?: string | null;
     column_id: string | null;
     board_id: string | null;
     user_id?: string | null;
     priority?: string | null;
     start_date?: string | null;
     end_date?: string | null;
     due_date?: string | null;
     completed?: boolean;
     status?: string | null;
     status_id?: string | null;
     type?: 'task' | 'story';
     parent_id?: string | null;
     assignee?: User | null;
     board_title?: string | null;
     priority_label?: string | null;
     priority_color?: string | null;
}

type SupabaseColumn = {
     id: string;
     title: string;
     board_id: string;
     order: number;
};

type SupabaseTeamMemberRow = {
     user: {
          id: string;
          name: string;
          email: string;
          image?: string | null;
     }[];
};

export const calendarApi = createApi({
     reducerPath: 'calendarApi',
     baseQuery: fakeBaseQuery(),
     tagTypes: ['UserBoards', 'CalendarTasks', 'TeamMembers', 'BoardColumns'],
     endpoints: (builder) => ({
          getUserBoards: builder.query<Board[], string>({
               async queryFn(userId) {
                    try {
                         if (!userId) {
                              return { data: [] };
                         }

                         // 1) team_members → team_id
                         const { data: tmRows, error: tmError } = await getSupabase().from('team_members').select('team_id').eq('user_id', userId);

                         if (tmError) {
                              return { error: { status: tmError.code ?? 400, data: tmError.message } };
                         }

                         const teamIds = (tmRows?.map((r) => r.team_id).filter(Boolean) as string[]) ?? [];

                         let boardsFromTeam: Board[] = [];

                         if (teamIds.length > 0) {
                              const { data: tbRows, error: tbError } = await getSupabase().from('team_boards').select('board_id').in('team_id', teamIds);

                              if (tbError) {
                                   return { error: { status: tbError.code ?? 400, data: tbError.message } };
                              }

                              const teamBoardIds = Array.from(new Set(tbRows?.map((r) => r.board_id).filter(Boolean) ?? []));

                              if (teamBoardIds.length > 0) {
                                   const { data: boardsData, error: bError } = await getSupabase().from('boards').select('id, title').in('id', teamBoardIds);

                                   if (bError) {
                                        return { error: { status: bError.code ?? 400, data: bError.message } };
                                   }

                                   boardsFromTeam = (boardsData as Board[]) ?? [];
                              }
                         }

                         // Personal boards
                         const { data: personalData, error: pError } = await getSupabase().from('boards').select('id, title').eq('user_id', userId);

                         if (pError) {
                              return { error: { status: pError.code ?? 400, data: pError.message } };
                         }
                         const personalBoards: Board[] = (personalData as Board[]) ?? [];

                         // Fallback: boards z historii zadań (jeśli brak zespołów)
                         let boardsFromTasks: Board[] = [];
                         if (teamIds.length === 0) {
                              const { data: taskRows, error: taskError } = await getSupabase().from('tasks').select('board_id').eq('user_id', userId);

                              if (!taskError && taskRows?.length) {
                                   const taskBoardIds = Array.from(new Set(taskRows.map((r) => r.board_id).filter(Boolean)));

                                   if (taskBoardIds.length > 0) {
                                        const { data: boardsData2, error: bError2 } = await getSupabase().from('boards').select('id, title').in('id', taskBoardIds);

                                        if (!bError2) {
                                             boardsFromTasks = (boardsData2 as Board[]) ?? [];
                                        } else {
                                             console.warn('[getUserBoards] Could not fetch boards from taskBoardIds:', bError2.message);
                                        }
                                   }
                              } else if (taskError) {
                                   console.warn('[getUserBoards] Could not fetch task-based boards:', taskError.message);
                              }
                         }

                         // Merge unikalnych tablic
                         const boardMap = new Map<string, Board>();
                         for (const b of [...boardsFromTeam, ...personalBoards, ...boardsFromTasks]) {
                              if (b.id) boardMap.set(b.id, b);
                         }

                         return { data: Array.from(boardMap.values()) };
                    } catch (err) {
                         const error = err as { message?: string };
                         return { error: { status: 500, data: error.message ?? 'Unknown error' } };
                    }
               },
               providesTags: (result) =>
                    result ? [...result.map(({ id }) => ({ type: 'UserBoards' as const, id })), { type: 'UserBoards' as const, id: 'LIST' }] : [{ type: 'UserBoards' as const, id: 'LIST' }],
          }),

          getColumnsByBoardId: builder.query<Column[], string>({
               async queryFn(boardId) {
                    try {
                         if (!boardId) return { data: [] };

                         const { data: cols, error } = await getSupabase().from('columns').select('id, title, board_id, order').eq('board_id', boardId).order('order', { ascending: true });

                         if (error) {
                              return { error: { status: error.code ?? 400, data: error.message } };
                         }

                         const mapped: Column[] = (cols ?? []).map((c: SupabaseColumn) => ({
                              id: c.id,
                              boardId: c.board_id,
                              title: c.title,
                              order: c.order,
                              tasks: [],
                         }));

                         return { data: mapped };
                    } catch (err) {
                         const error = err as { message?: string };
                         return { error: { status: 500, data: error.message ?? 'Unknown error' } };
                    }
               },
               providesTags: (result, _error, boardId) =>
                    result
                         ? [...result.map((col) => ({ type: 'BoardColumns' as const, id: col.id })), { type: 'BoardColumns' as const, id: boardId }]
                         : [{ type: 'BoardColumns' as const, id: boardId }],
          }),

          getTasksByBoardsAndDate: builder.query<CalendarTask[], { boardIds: string[]; start: string; end: string }>({
               async queryFn({ boardIds, start, end }) {
                    try {
                         if (!boardIds.length) return { data: [] };

                         const orFilter = [`and(start_date.lte.${end},end_date.gte.${start})`, `and(start_date.lte.${end},end_date.is.null)`].join(',');

                         const { data: tasks, error } = await getSupabase()
                              .from('tasks')
                              .select(
                                   `
              *,
              assignee:users!tasks_user_id_fkey(id, name, email, image),
              board:boards!tasks_board_id_fkey(id, title),
              priority_data:priorities!tasks_priority_fkey(id, label, color)
            `,
                              )
                              .in('board_id', boardIds)
                              .or(orFilter);

                         if (error) {
                              return { error: { status: error.code ?? 400, data: error.message } };
                         }

                         const enriched: CalendarTask[] = (tasks ?? []).map((t: Record<string, unknown>) => ({
                              ...t,
                              board_title: (t.board as { title?: string } | null)?.title ?? null,
                              priority_label: (t.priority_data as { label?: string } | null)?.label ?? null,
                              priority_color: (t.priority_data as { color?: string } | null)?.color ?? null,
                              assignee: t.assignee as User | null,
                         })) as CalendarTask[];

                         return { data: enriched };
                    } catch (err) {
                         const error = err as { message?: string };
                         return { error: { status: 500, data: error.message ?? 'Unknown error' } };
                    }
               },
               providesTags: (result) =>
                    result ? [...result.map(({ id }) => ({ type: 'CalendarTasks' as const, id })), { type: 'CalendarTasks' as const, id: 'LIST' }] : [{ type: 'CalendarTasks' as const, id: 'LIST' }],
          }),
          getTeamMembersByBoardId: builder.query<User[], string>({
               async queryFn(boardId) {
                    try {
                         if (!boardId) return { data: [] };

                         const { data: tbRows, error: tbError } = await getSupabase().from('team_boards').select('team_id').eq('board_id', boardId);

                         if (tbError) {
                              return { error: { status: tbError.code ?? 400, data: tbError.message } };
                         }

                         const teamIds = (tbRows?.map((r) => r.team_id).filter(Boolean) as string[]) ?? [];
                         if (!teamIds.length) return { data: [] };

                         const { data: tmRows, error: tmError } = await getSupabase().from('team_members').select('user(id, name, email, image)').in('team_id', teamIds);

                         if (tmError) {
                              return { error: { status: tmError.code ?? 400, data: tmError.message } };
                         }

                         const map = new Map<string, User>();
                         for (const row of tmRows ?? []) {
                              const userRow = row as SupabaseTeamMemberRow;
                              const usersArray = userRow.user || [];

                              for (const u of usersArray) {
                                   if (u?.id && !map.has(u.id)) {
                                        map.set(u.id, {
                                             id: u.id,
                                             name: u.name ?? '',
                                             email: u.email,
                                             image: u.image ?? undefined,
                                        });
                                   }
                              }
                         }

                         return { data: Array.from(map.values()) };
                    } catch (err) {
                         const error = err as { message?: string };
                         return { error: { status: 500, data: error.message ?? 'Unknown error' } };
                    }
               },
               providesTags: (result) => (result ? result.map(({ id }) => ({ type: 'TeamMembers' as const, id })) : []),
          }),
     }),
});

export const { useGetUserBoardsQuery, useGetColumnsByBoardIdQuery, useGetTasksByBoardsAndDateQuery, useGetTeamMembersByBoardIdQuery } = calendarApi;

import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { Board, Column, Task, User } from '@/app/types/globalTypes';

export interface BoardWithCounts extends Board {
     _count: {
          tasks: number;
          teamMembers: number;
          completedTasks?: number;
     };
}

interface RawBoard {
     id: string;
     title: string;
     user_id: string;
     created_at?: string;
     updated_at?: string;
     owner?: unknown;
}

interface RawColumn {
     id: string;
     board_id: string;
     title: string;
     order: number;
     tasks?: unknown[];
}

interface RawTask {
     id: string;
     title: string;
     description: string;
     column_id: string;
     board_id: string;
     priority: string;
     user_id?: string;
     sort_order?: number;
     completed: boolean;
     created_at?: string;
     updated_at?: string;
     images?: string;
     start_date?: string;
     end_date?: string;
     due_date?: string;
     status?: string;
     status_id?: string;
     assignee?: unknown;
}

interface RawAssignee {
     id: string;
     name: string;
     email: string;
     image?: string;
}

export const boardEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     addBoard: builder.mutation<Board, { title: string; user_id: string }>({
          async queryFn({ title, user_id }) {
               try {
                    const { data, error } = await getSupabase().from('boards').insert({ title, user_id }).select('*').single();
                    if (error || !data) throw error || new Error('Add board failed');
                    const newBoard: Board = {
                         id: data.id,
                         title: data.title,
                         user_id: data.user_id,
                         ownerName: undefined,
                         ownerEmail: undefined,
                         columns: [],
                         statuses: [],
                         created_at: data.created_at,
                         updated_at: data.updated_at,
                    };
                    return { data: newBoard };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.addBoard] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: () => [{ type: 'Board', id: 'LIST' }],
     }),

     getBoard: builder.query<Board, string>({
          async queryFn(boardId) {
               try {
                    const { data: bRaw, error: be } = await supabase
                         .from('boards')
                         .select(
                              `
          *,
          owner:users!boards_user_id_fkey(id, name, email),
          statuses!statuses_board_id_fkey(id, label, color)
        `,
                         )
                         .eq('id', boardId)
                         .single();
                    if (be || !bRaw) throw be || new Error('Board not found');

                    const rawBoard = bRaw as RawBoard & { statuses?: { id: string; label: string; color: string }[] };

                    let ownerObj: { name: string; email: string } | null = null;
                    if (Array.isArray(rawBoard.owner) && rawBoard.owner.length > 0) {
                         ownerObj = rawBoard.owner[0] as { name: string; email: string };
                    } else if (rawBoard.owner) {
                         ownerObj = rawBoard.owner as { name: string; email: string };
                    }

                    const boardBase: Board = {
                         id: rawBoard.id,
                         title: rawBoard.title,
                         user_id: rawBoard.user_id,
                         ownerName: ownerObj?.name,
                         ownerEmail: ownerObj?.email,
                         columns: [],
                         statuses: Array.isArray(rawBoard.statuses) ? rawBoard.statuses : [],
                         created_at: rawBoard.created_at,
                         updated_at: rawBoard.updated_at,
                    };

                    const { data: colsRaw = [], error: ce } = await supabase
                         .from('columns')
                         .select(
                              `
          *,
          tasks:tasks(
            *,
            assignee:users!tasks_user_id_fkey(id, name, email, image)
          )
        `,
                         )
                         .eq('board_id', boardId)
                         .order('order', { ascending: true });
                    if (ce) throw ce;

                    boardBase.columns = (colsRaw as RawColumn[]).map((c) => {
                         const rawTasks: RawTask[] = Array.isArray(c.tasks) ? (c.tasks as RawTask[]) : [];
                         rawTasks.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                         const mappedTasks: Task[] = rawTasks.map((t) => {
                              const rawAssignee = Array.isArray(t.assignee) ? (t.assignee[0] as RawAssignee) : (t.assignee as RawAssignee);
                              const assigneeObj: User | undefined = rawAssignee
                                   ? {
                                          id: rawAssignee.id,
                                          name: rawAssignee.name,
                                          email: rawAssignee.email,
                                          image: rawAssignee.image,
                                     }
                                   : undefined;
                              return {
                                   id: t.id,
                                   title: t.title,
                                   description: t.description,
                                   column_id: t.column_id,
                                   board_id: t.board_id,
                                   priority: t.priority,
                                   user_id: t.user_id,
                                   order: t.sort_order ?? 0,
                                   sort_order: t.sort_order ?? 0,
                                   completed: t.completed,
                                   created_at: t.created_at,
                                   updated_at: t.updated_at,
                                   images: t.images ? JSON.parse(t.images) : null,
                                   assignee: assigneeObj,
                                   start_date: t.start_date,
                                   end_date: t.end_date,
                                   due_date: t.due_date,
                                   status_id: t.status_id || null,
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
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getBoard] error:', error);
                    return {
                         error: { status: 'CUSTOM_ERROR', error: error.message },
                    };
               }
          },
          providesTags: (result, _error, boardId) =>
               result
                    ? [
                           { type: 'Board', id: boardId },
                           ...result.columns.map((c) => ({
                                type: 'Column' as const,
                                id: c.id,
                           })),
                      ]
                    : [{ type: 'Board', id: boardId }],
     }),

     getMyBoards: builder.query<BoardWithCounts[], string>({
          async queryFn(userId) {
               try {
                    const { data: ownedRaw = [], error: ownedErr } = await supabase
                         .from('boards')
                         .select(
                              `
            *,
            owner:users!boards_user_id_fkey(id, name, email)
          `,
                         )
                         .eq('user_id', userId);
                    if (ownedErr) throw ownedErr;
                    const ownedBoards: Board[] = (ownedRaw as RawBoard[]).map((b) => {
                         let ownerObj: { name: string; email: string } | null = null;
                         if (Array.isArray(b.owner) && b.owner.length > 0) {
                              ownerObj = b.owner[0] as { name: string; email: string };
                         } else if (b.owner) {
                              ownerObj = b.owner as { name: string; email: string };
                         }
                         return {
                              id: b.id,
                              title: b.title,
                              user_id: b.user_id,
                              ownerName: ownerObj?.name,
                              ownerEmail: ownerObj?.email,
                              columns: [],
                              statuses: [],
                              created_at: b.created_at,
                              updated_at: b.updated_at,
                         } as Board;
                    });

                    const { data: memRaw = [], error: memErr } = await getSupabase().from('team_members').select('team_id').eq('user_id', userId);
                    if (memErr) throw memErr;
                    const teamIds = (memRaw as { team_id: string }[]).map((m) => m.team_id);
                    let viaTeamsBoards: Board[] = [];
                    if (teamIds.length > 0) {
                         const { data: teamsRaw = [], error: teamsErr } = await getSupabase().from('teams').select('board_id').in('id', teamIds);
                         if (teamsErr) throw teamsErr;
                         const boardIds = Array.from(new Set((teamsRaw as { board_id: string }[]).map((t) => t.board_id)));
                         if (boardIds.length > 0) {
                              const { data: boardsFromTeamsRaw = [], error: bErr } = await supabase
                                   .from('boards')
                                   .select(
                                        `
                *,
                owner:users!boards_user_id_fkey(id, name, email)
              `,
                                   )
                                   .in('id', boardIds);
                              if (bErr) throw bErr;
                              viaTeamsBoards = (boardsFromTeamsRaw as RawBoard[]).map((b) => {
                                   let ownerObj: { name: string; email: string } | null = null;
                                   if (Array.isArray(b.owner) && b.owner.length > 0) {
                                        ownerObj = b.owner[0] as { name: string; email: string };
                                   } else if (b.owner) {
                                        ownerObj = b.owner as { name: string; email: string };
                                   }
                                   return {
                                        id: b.id,
                                        title: b.title,
                                        user_id: b.user_id,
                                        ownerName: ownerObj?.name,
                                        ownerEmail: ownerObj?.email,
                                        columns: [],
                                        statuses: [],
                                        created_at: b.created_at,
                                        updated_at: b.updated_at,
                                   } as Board;
                              });
                         }
                    }

                    const allBoards = [...ownedBoards, ...viaTeamsBoards];
                    const uniqueMap = new Map<string, Board>();
                    allBoards.forEach((b) => uniqueMap.set(b.id, b));
                    const uniqueBoards = Array.from(uniqueMap.values());

                    const boardsWithCounts: BoardWithCounts[] = await Promise.all(
                         uniqueBoards.map(async (b) => {
                              const { count: taskCountRaw } = await getSupabase().from('tasks').select('id', { count: 'exact', head: true }).eq('board_id', b.id);
                              const taskCount = taskCountRaw ?? 0;

                              const { data: boardTeamsRaw = [] } = await getSupabase().from('teams').select('id').eq('board_id', b.id);
                              const bTeamIds = (boardTeamsRaw as { id: string }[]).map((t) => t.id);

                              let memberCount = 0;
                              if (bTeamIds.length > 0) {
                                   const { count: memberCountRaw } = await getSupabase().from('team_members').select('id', { count: 'exact', head: true }).in('team_id', bTeamIds);
                                   memberCount = memberCountRaw ?? 0;
                              }

                              return {
                                   ...b,
                                   _count: { tasks: taskCount, teamMembers: memberCount },
                              };
                         }),
                    );

                    return { data: boardsWithCounts };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getMyBoards] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => (result ? result.map((b) => ({ type: 'Board' as const, id: b.id })) : []),
     }),

     removeBoard: builder.mutation<{ id: string }, { boardId: string }>({
          async queryFn({ boardId }) {
               try {
                    const { error } = await getSupabase().from('boards').delete().eq('id', boardId);
                    if (error) throw error;
                    return { data: { id: boardId } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.removeBoard] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { boardId }) => [
               { type: 'Board', id: boardId },
               { type: 'Board', id: 'LIST' },
          ],
     }),

     updateBoardTitle: builder.mutation<{ id: string; title: string }, { boardId: string; title: string }>({
          async queryFn({ boardId, title }) {
               try {
                    const { error } = await getSupabase().from('boards').update({ title }).eq('id', boardId);
                    if (error) throw error;
                    return { data: { id: boardId, title } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateBoardTitle] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
     }),

     getUserBoards: builder.query<Board[], string>({
          async queryFn(userId) {
               try {
                    const { data: ownBoardsData, error: ownErr } = await getSupabase().from('boards').select('id,title,user_id,created_at').eq('user_id', userId);
                    if (ownErr) {
                         console.error('getUserBoards – owned boards error:', ownErr.message);
                    }
                    const own = ownBoardsData || [];

                    const { data: tm, error: tmErr } = await getSupabase().from('team_members').select('team_id').eq('user_id', userId);
                    if (tmErr) {
                         console.error('getUserBoards – team_members error:', tmErr.message);
                    }
                    const teamIds = tm?.map((r) => r.team_id) || [];

                    let teamBoardIds: string[] = [];
                    if (teamIds.length > 0) {
                         const { data: tb, error: tbErr } = await getSupabase().from('team_boards').select('board_id').in('team_id', teamIds);
                         if (tbErr) {
                              console.error('getUserBoards – team_boards error:', tbErr.message);
                         } else {
                              teamBoardIds = tb?.map((r) => r.board_id) || [];
                         }
                    }

                    let teamBoards: { id: string; title: string; user_id: string; created_at?: string }[] = [];
                    if (teamBoardIds.length > 0) {
                         const { data: tBoardsData, error: tBoardsErr } = await getSupabase().from('boards').select('id,title,user_id,created_at').in('id', teamBoardIds);
                         if (tBoardsErr) {
                              console.error('getUserBoards – fetch boards by IDs error:', tBoardsErr.message);
                         } else {
                              teamBoards = tBoardsData || [];
                         }
                    }

                    const map = new Map<string, Board>();
                    own.forEach((b: { id: string; title: string; user_id: string; created_at?: string }) =>
                         map.set(b.id, { ...b, ownerName: undefined, ownerEmail: undefined, columns: [], statuses: [], updated_at: undefined } as Board),
                    );
                    teamBoards.forEach((b: { id: string; title: string; user_id: string; created_at?: string }) => {
                         if (!map.has(b.id)) map.set(b.id, { ...b, ownerName: undefined, ownerEmail: undefined, statuses: [], columns: [], updated_at: undefined } as Board);
                    });
                    const result: Board[] = Array.from(map.values());
                    return { data: result };
               } catch (err) {
                    const error = err as Error;
                    console.error('getUserBoards – unexpected error:', error);
                    return { error: { status: 500, data: error.message } };
               }
          },
          providesTags: (result) => (result ? [...result.map(({ id }) => ({ type: 'Boards' as const, id })), { type: 'Boards', id: 'LIST' }] : [{ type: 'Boards', id: 'LIST' }]),
     }),

     getBoardsByTeamId: builder.query<Board[], string>({
          async queryFn(teamId) {
               try {
                    const { data: links, error: linkErr } = await getSupabase().from('team_boards').select('board_id').eq('team_id', teamId);

                    if (linkErr) throw linkErr;

                    const boardIds = (links ?? []).map((l) => l.board_id);
                    if (!boardIds.length) return { data: [] };

                    const { data: boards, error: boardErr } = await getSupabase().from('boards').select('*').in('id', boardIds);

                    if (boardErr) throw boardErr;

                    return { data: (boards ?? []) as Board[] };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, teamId) => [{ type: 'Team', id: teamId }],
     }),

     getAllBoards: builder.query<BoardWithCounts[], void>({
          async queryFn() {
               try {
                    const { data: boards, error: boardsError } = await getSupabase().from('boards').select('id, title, user_id, created_at, updated_at').order('created_at', { ascending: false });

                    if (boardsError) throw boardsError;
                    if (!boards || boards.length === 0) return { data: [] };

                    const boardsWithCounts: BoardWithCounts[] = await Promise.all(
                         boards.map(async (board) => {
                              const { count: taskCount = 0 } = await getSupabase().from('tasks').select('*', { count: 'exact', head: true }).eq('board_id', board.id);

                              const { data: teamsData } = await getSupabase().from('teams').select('id').eq('board_id', board.id);

                              const teamIds = (teamsData ?? []).map((t: { id: string }) => t.id);

                              let memberCount = 0;
                              if (teamIds.length > 0) {
                                   const { count } = await getSupabase().from('team_members').select('*', { count: 'exact', head: true }).in('team_id', teamIds);

                                   memberCount = count ?? 0;
                              }

                              return {
                                   id: board.id,
                                   title: board.title,
                                   user_id: board.user_id,
                                   created_at: board.created_at,
                                   updated_at: board.updated_at,
                                   columns: [],
                                   statuses: [],
                                   ownerName: undefined,
                                   ownerEmail: undefined,
                                   _count: {
                                        tasks: taskCount ?? 0,
                                        teamMembers: memberCount,
                                   },
                              } as BoardWithCounts;
                         }),
                    );

                    return { data: boardsWithCounts };
               } catch (err) {
                    console.error('[getAllBoards] error:', err);
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: (err as Error)?.message || 'Failed to fetch boards',
                         },
                    };
               }
          },

          providesTags: (result) => (result ? [{ type: 'Board', id: 'LIST' }, ...result.map(({ id }) => ({ type: 'Board' as const, id }))] : [{ type: 'Board', id: 'LIST' }]),
     }),
});

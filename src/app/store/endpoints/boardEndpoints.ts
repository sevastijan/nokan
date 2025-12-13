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

interface RawCollaborator {
     id: string;
     user_id: string;
     user?: { id: string; name: string; email: string; image?: string } | { id: string; name: string; email: string; image?: string }[];
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
     collaborators?: RawCollaborator[];
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
                    const { data: bRaw, error: be } = await getSupabase()
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

                    const { data: colsRaw = [], error: ce } = await getSupabase()
                         .from('columns')
                         .select(
                              `
          *,
          tasks:tasks(
            *,
            assignee:users!tasks_user_id_fkey(id, name, email, image, custom_name, custom_image),
            collaborators:task_collaborators(
              id,
              user_id,
              user:users!task_collaborators_user_id_fkey(id, name, email, image, custom_name, custom_image)
            )
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
                              const rawAssignee = Array.isArray(t.assignee)
                                   ? (t.assignee[0] as RawAssignee & { custom_name?: string; custom_image?: string })
                                   : (t.assignee as RawAssignee & { custom_name?: string; custom_image?: string });
                              const assigneeObj: User | undefined = rawAssignee
                                   ? {
                                          id: rawAssignee.id,
                                          name: rawAssignee.name,
                                          email: rawAssignee.email,
                                          image: rawAssignee.image,
                                          custom_name: rawAssignee.custom_name,
                                          custom_image: rawAssignee.custom_image,
                                     }
                                   : undefined;

                              // Process collaborators
                              const collaborators: User[] = (t.collaborators || [])
                                   .filter((c) => c.user)
                                   .map((c) => {
                                        const u = Array.isArray(c.user) ? c.user[0] : c.user;
                                        return {
                                             id: u?.id || c.user_id,
                                             name: u?.name || '',
                                             email: u?.email || '',
                                             image: u?.image,
                                             custom_name: (u as { custom_name?: string })?.custom_name,
                                             custom_image: (u as { custom_image?: string })?.custom_image,
                                        };
                                   });

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
                                   collaborators,
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
                    const { data: ownedRaw = [], error: ownedErr } = await getSupabase()
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
                              const { data: boardsFromTeamsRaw = [], error: bErr } = await getSupabase()
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

     addMemberToBoard: builder.mutation<{ success: boolean }, { boardId: string; userId: string }>({
          async queryFn({ boardId, userId }) {
               try {
                    const { data: existingTeam, error: findError } = await getSupabase().from('teams').select('id').eq('board_id', boardId).maybeSingle();

                    if (findError && findError.code !== 'PGRST116') {
                         throw findError;
                    }

                    let teamId: string;

                    if (existingTeam) {
                         teamId = existingTeam.id;
                    } else {
                         const { data: newTeam, error: createError } = await getSupabase().from('teams').insert({ board_id: boardId }).select('id').single();

                         if (createError || !newTeam) {
                              throw createError || new Error('Failed to create team');
                         }
                         teamId = newTeam.id;
                    }

                    const { error: insertError } = await getSupabase().from('team_members').insert({ team_id: teamId, user_id: userId });

                    if (insertError) {
                         if (insertError.code === '23505') {
                              return { data: { success: true } };
                         }
                         throw insertError;
                    }

                    return { data: { success: true } };
               } catch (err) {
                    const error = err as { message?: string };
                    console.error('[addMemberToBoard] error:', error);
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: error.message || 'Failed to add member to board',
                         },
                    };
               }
          },
          invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
     }),
     getBoardMembers: builder.query<User[], string>({
          async queryFn(boardId) {
               try {
                    const { data: team, error: teamError } = await getSupabase().from('teams').select('id').eq('board_id', boardId).maybeSingle();

                    if (teamError) throw teamError;
                    if (!team) return { data: [] };

                    const { data: membersRaw, error: membersError } = await getSupabase()
                         .from('team_members')
                         .select('user:users!team_members_user_id_fkey(id, name, email, image, custom_name, custom_image)')
                         .eq('team_id', team.id);

                    if (membersError) throw membersError;
                    if (!membersRaw || membersRaw.length === 0) return { data: [] };

                    const users: User[] = membersRaw.map((row) => {
                         const userData = Array.isArray(row.user) ? row.user[0] : row.user;

                         return {
                              id: userData.id,
                              name: userData.name,
                              email: userData.email,
                              image: userData.image || undefined,
                              custom_name: userData.custom_name || undefined,
                              custom_image: userData.custom_image || undefined,
                              role: undefined,
                              created_at: undefined,
                         } as User;
                    });

                    return { data: users };
               } catch (err) {
                    console.error('[getBoardMembers] error:', err);
                    return { data: [] };
               }
          },
          providesTags: (result) =>
               result ? [...result.map((u) => ({ type: 'BoardMember' as const, id: u.id })), { type: 'BoardMember' as const, id: 'LIST' }] : [{ type: 'BoardMember' as const, id: 'LIST' }],
     }),

     removeMemberFromBoard: builder.mutation<{ success: boolean }, { boardId: string; userId: string }>({
          async queryFn({ boardId, userId }) {
               try {
                    const { data: team, error: teamError } = await getSupabase().from('teams').select('id').eq('board_id', boardId).single();

                    if (teamError && teamError.code !== 'PGRST116') {
                         throw teamError;
                    }

                    if (!team) {
                         return { data: { success: true } };
                    }

                    const { error: deleteError } = await getSupabase().from('team_members').delete().eq('team_id', team.id).eq('user_id', userId);

                    if (deleteError) throw deleteError;

                    return { data: { success: true } };
               } catch (err) {
                    const error = err as { message?: string };
                    console.error('[removeMemberFromBoard] error:', error);

                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: error.message || 'Nie udało się usunąć użytkownika z boarda',
                         },
                    };
               }
          },
          invalidatesTags: (_result, _error, { boardId }) => [
               { type: 'Board', id: boardId },
               { type: 'BoardMember', id: 'LIST' },
          ],
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
     // Dodaj te endpointy do pliku z boardEndpoints

     getBoardNotes: builder.query<{ id: string; board_id: string; content: { html: string }; created_at: string; updated_at: string } | null, string>({
          async queryFn(boardId) {
               try {
                    const { data, error } = await getSupabase().from('board_notes').select('*').eq('board_id', boardId).maybeSingle();

                    if (error && error.code !== 'PGRST116') throw error;

                    return { data: data || null };
               } catch (err) {
                    const error = err as Error;
                    console.error('[getBoardNotes] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, boardId) => [{ type: 'BoardNotes', id: boardId }],
     }),

     saveBoardNotes: builder.mutation<{ success: boolean }, { boardId: string; content: { html: string } }>({
          async queryFn({ boardId, content }) {
               try {
                    // Najpierw sprawdź czy istnieją notatki
                    const { data: existing } = await getSupabase().from('board_notes').select('id').eq('board_id', boardId).maybeSingle();

                    if (existing) {
                         // Update
                         const { error } = await getSupabase()
                              .from('board_notes')
                              .update({
                                   content,
                                   updated_at: new Date().toISOString(),
                              })
                              .eq('board_id', boardId);

                         if (error) throw error;
                    } else {
                         // Insert
                         const { error } = await getSupabase().from('board_notes').insert({
                              board_id: boardId,
                              content,
                         });

                         if (error) throw error;
                    }

                    return { data: { success: true } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[saveBoardNotes] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, { boardId }) => [{ type: 'BoardNotes', id: boardId }],
     }),
});

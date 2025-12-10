import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { User, BoardWithCounts, ClientSubmission } from '@/app/types/globalTypes';

interface BoardClient {
     id: string;
     board_id: string;
     client_id: string;
     client_external_id?: string | null;
     assigned_by: string | null;
     can_delete_own: boolean;
     can_edit_after_submission: boolean;
     created_at: string;
     updated_at: string;
     client?: User;
}

interface RemoveClientResult {
     id: string;
     clientId?: string;
}

interface AssignClientPayload {
     boardId: string;
     clientExternalId: string;
     assignedBy?: string | null;
     can_delete_own?: boolean;
     can_edit_after_submission?: boolean;
}

interface UpdatePermissionsPayload {
     boardClientId: string;
     can_delete_own?: boolean;
     can_edit_after_submission?: boolean;
}

export const clientManagementEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getAllClients: builder.query<User[], void>({
          async queryFn() {
               const { data, error } = await getSupabase().from('users').select('*').eq('role', 'CLIENT').order('created_at', { ascending: false });

               if (error) {
                    return { error: { status: 'FETCH_ERROR', error: error.message } };
               }

               return { data: data as User[] };
          },
          providesTags: [{ type: 'Client', id: 'LIST' }],
     }),

     assignClientToBoard: builder.mutation<BoardClient, AssignClientPayload>({
          async queryFn({ boardId, clientExternalId, assignedBy, can_delete_own = true, can_edit_after_submission = true }) {
               try {
                    const { data: userData, error: userError } = await getSupabase().from('users').select('id').eq('id', clientExternalId).single();

                    if (userError || !userData) {
                         return {
                              error: {
                                   status: 'NOT_FOUND',
                                   error: 'Klient nie został znaleziony',
                              },
                         };
                    }

                    const { data: existing } = await getSupabase().from('board_clients').select('id').eq('board_id', boardId).eq('client_id', userData.id).maybeSingle();

                    if (existing) {
                         return {
                              error: {
                                   status: 'CONFLICT',
                                   error: 'Klient jest już przypisany do tego projektu',
                              },
                         };
                    }

                    const payload: {
                         board_id: string;
                         client_id: string;
                         client_external_id: string;
                         assigned_by?: string | null;
                         can_delete_own: boolean;
                         can_edit_after_submission: boolean;
                    } = {
                         board_id: boardId,
                         client_id: userData.id,
                         client_external_id: clientExternalId,
                         can_delete_own,
                         can_edit_after_submission,
                    };

                    if (assignedBy) {
                         payload.assigned_by = assignedBy;
                    }

                    const { data, error } = await getSupabase().from('board_clients').insert(payload).select('*').single();

                    if (error) {
                         return { error: { status: 'INSERT_ERROR', error: error.message } };
                    }

                    return { data: data as BoardClient };
               } catch {
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: 'Nie udało się przypisać klienta',
                         },
                    };
               }
          },
          invalidatesTags: (_result, _error, { clientExternalId, boardId }) => [
               { type: 'ClientBoard', id: clientExternalId },
               { type: 'ClientBoard', id: 'LIST' },
               { type: 'BoardClient', id: 'LIST' },
               { type: 'BoardClient', id: boardId },
          ],
     }),

     getClientBoardAssignments: builder.query<{ id: string; board_id: string }[], string>({
          async queryFn(clientId) {
               const { data, error } = await getSupabase().from('board_clients').select('id, board_id').eq('client_id', clientId);

               if (error) {
                    return { error: { status: 'FETCH_ERROR', error: error.message } };
               }

               return { data: data ?? [] };
          },
          providesTags: (result, _error, clientId) => [
               { type: 'ClientBoard', id: clientId },
               ...(result?.map(({ id }) => ({
                    type: 'ClientBoard' as const,
                    id,
               })) ?? []),
          ],
     }),

     removeClientFromBoard: builder.mutation<RemoveClientResult, { boardClientId: string }>({
          async queryFn({ boardClientId }) {
               try {
                    const { data: boardClient } = await getSupabase().from('board_clients').select('client_id, board_id').eq('id', boardClientId).single();

                    const { error } = await getSupabase().from('board_clients').delete().eq('id', boardClientId);

                    if (error) {
                         return { error: { status: 'DELETE_ERROR', error: error.message } };
                    }

                    return {
                         data: {
                              id: boardClientId,
                              clientId: boardClient?.client_id,
                         },
                    };
               } catch {
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: 'Nie udało się usunąć przypisania',
                         },
                    };
               }
          },
          invalidatesTags: (result, _error, { boardClientId }) => {
               const tags: Array<{ type: 'ClientBoard' | 'BoardClient'; id: string }> = [
                    { type: 'ClientBoard', id: 'LIST' },
                    { type: 'BoardClient', id: 'LIST' },
                    { type: 'ClientBoard', id: boardClientId },
               ];

               if (result?.clientId) {
                    tags.push({ type: 'ClientBoard', id: result.clientId });
               }

               return tags;
          },
     }),

     getClientBoards: builder.query<string[], string>({
          async queryFn(clientId) {
               const { data, error } = await getSupabase().from('board_clients').select('board_id').eq('client_id', clientId);

               if (error) {
                    return { error: { status: 'FETCH_ERROR', error: error.message } };
               }

               return { data: data?.map((bc) => bc.board_id) ?? [] };
          },
          providesTags: (_result, _error, clientId) => [{ type: 'ClientBoard', id: clientId }],
     }),

     getBoardClients: builder.query<BoardClient[], string>({
          async queryFn(boardId) {
               const { data, error } = await getSupabase().from('board_clients').select('*, client:users!board_clients_client_id_fkey(*)').eq('board_id', boardId);

               if (error) {
                    return { error: { status: 'FETCH_ERROR', error: error.message } };
               }

               return { data: data as BoardClient[] };
          },
          providesTags: (result, _error, boardId) =>
               result
                    ? [
                           ...result.map((bc) => ({
                                type: 'BoardClient' as const,
                                id: bc.id,
                           })),
                           { type: 'BoardClient', id: boardId },
                      ]
                    : [{ type: 'BoardClient', id: boardId }],
     }),

     updateClientPermissions: builder.mutation<BoardClient, UpdatePermissionsPayload>({
          async queryFn({ boardClientId, can_delete_own, can_edit_after_submission }) {
               try {
                    const updates: Partial<Pick<BoardClient, 'can_delete_own' | 'can_edit_after_submission'>> = {};

                    if (can_delete_own !== undefined) {
                         updates.can_delete_own = can_delete_own;
                    }

                    if (can_edit_after_submission !== undefined) {
                         updates.can_edit_after_submission = can_edit_after_submission;
                    }

                    if (Object.keys(updates).length === 0) {
                         return {
                              error: {
                                   status: 'VALIDATION_ERROR',
                                   error: 'Nie podano żadnych uprawnień do aktualizacji',
                              },
                         };
                    }

                    const { data, error } = await getSupabase().from('board_clients').update(updates).eq('id', boardClientId).select('*').single();

                    if (error) {
                         return { error: { status: 'UPDATE_ERROR', error: error.message } };
                    }

                    return { data: data as BoardClient };
               } catch {
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: 'Nie udało się zaktualizować uprawnień',
                         },
                    };
               }
          },
          invalidatesTags: (_result, _error, { boardClientId }) => [{ type: 'BoardClient', id: boardClientId }],
     }),

     getClientSubmissions: builder.query<ClientSubmission[], string>({
          async queryFn(clientId) {
               try {
                    const { data: submissionsData, error: subError } = await supabase
                         .from('submissions')
                         .select(
                              `
                         *,
                         tasks!inner(
                              id,
                              title,
                              description,
                              priority,
                              status_id,
                              created_at,
                              updated_at,
                              column_id,
                              board_id,
                              user_id,
                              sort_order,
                              completed
                         )
                    `,
                         )
                         .eq('client_id', clientId)
                         .order('created_at', { ascending: false });

                    if (subError) throw subError;

                    const statusIds = [
                         ...new Set(
                              submissionsData
                                   ?.map((item) => {
                                        const task = Array.isArray(item.tasks) ? item.tasks[0] : item.tasks;
                                        return task?.status_id;
                                   })
                                   .filter((id): id is string => typeof id === 'string'),
                         ),
                    ];

                    const statusesMap: Record<string, { id: string; label: string; color: string }> = {};
                    if (statusIds.length > 0) {
                         const { data: statusesData } = await getSupabase().from('statuses').select('id, label, color').in('id', statusIds);

                         statusesData?.forEach((status: { id: string; label: string; color: string }) => {
                              statusesMap[status.id] = status;
                         });
                    }

                    const submissions: ClientSubmission[] = (submissionsData || []).map((item) => {
                         const task = Array.isArray(item.tasks) ? item.tasks[0] : item.tasks;
                         const status = task?.status_id ? statusesMap[task.status_id] : null;

                         return {
                              submission_id: item.id,
                              client_name: item.client_name || undefined,
                              client_email: item.client_email || undefined,

                              id: task?.id || '',
                              title: task?.title || '',
                              description: task?.description || '',
                              column_id: task?.column_id || '',
                              board_id: task?.board_id || '',
                              priority: task?.priority || 'low',
                              user_id: task?.user_id || null,
                              order: task?.sort_order || 0,
                              sort_order: task?.sort_order || 0,
                              completed: task?.completed || false,
                              created_at: task?.created_at || item.created_at,
                              updated_at: task?.updated_at || undefined,
                              images: undefined,
                              assignee: null,
                              start_date: null,
                              end_date: null,
                              due_date: null,
                              status_id: task?.status_id || null,

                              status: status
                                   ? {
                                          id: status.id,
                                          label: status.label,
                                          color: status.color,
                                     }
                                   : null,
                         };
                    });

                    return { data: submissions };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getClientSubmissions] error:', error);
                    return {
                         error: { status: 'CUSTOM_ERROR', error: error.message },
                    };
               }
          },
          providesTags: (result) =>
               result ? [...result.map(({ submission_id }) => ({ type: 'Submission' as const, id: submission_id })), { type: 'Submission', id: 'LIST' }] : [{ type: 'Submission', id: 'LIST' }],
     }),
     getClientBoardsWithDetails: builder.query<BoardWithCounts[], string>({
          async queryFn(clientId) {
               try {
                    const { data: assignments, error: assignErr } = await getSupabase().from('board_clients').select('board_id').eq('client_id', clientId);

                    if (assignErr) {
                         return {
                              error: {
                                   status: 'FETCH_ERROR',
                                   error: assignErr.message,
                              },
                         };
                    }

                    if (!assignments || assignments.length === 0) {
                         return { data: [] };
                    }

                    const boardIds = assignments.map((a) => a.board_id);

                    const { data: boards, error: boardErr } = await getSupabase().from('boards').select('id, title, created_at, updated_at').in('id', boardIds);

                    if (boardErr) {
                         return {
                              error: {
                                   status: 'FETCH_ERROR',
                                   error: boardErr.message,
                              },
                         };
                    }

                    const boardsWithCounts = await Promise.all(
                         (boards ?? []).map(async (board) => {
                              const { count = 0 } = await getSupabase().from('tasks').select('*', { count: 'exact', head: true }).eq('board_id', board.id);

                              return {
                                   id: board.id,
                                   title: board.title,
                                   created_at: board.created_at,
                                   updated_at: board.updated_at,
                                   _count: {
                                        tasks: count,
                                        teamMembers: 0,
                                   },
                              } as BoardWithCounts;
                         }),
                    );

                    return { data: boardsWithCounts };
               } catch (err) {
                    console.error('getClientBoardsWithDetails error:', err);
                    return {
                         error: {
                              status: 'CUSTOM_ERROR',
                              error: 'Nie udało się pobrać przypisanych projektów',
                         },
                    };
               }
          },
          providesTags: (result) =>
               result
                    ? [
                           ...result.map(({ id }) => ({
                                type: 'ClientBoard' as const,
                                id,
                           })),
                           { type: 'ClientBoard', id: 'LIST' },
                      ]
                    : [{ type: 'ClientBoard', id: 'LIST' }],
     }),
});

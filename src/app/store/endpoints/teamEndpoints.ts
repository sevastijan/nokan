import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { Team, TeamMember, User } from '@/app/types/globalTypes';

interface RawTeamMember {
     id: string;
     team_id: string;
     user_id: string;
     created_at?: string;
     user?: RawUser | RawUser[] | unknown;
}

interface RawUser {
     id: string;
     name: string;
     email: string;
     image?: string;
     role?: string;
     created_at?: string;
}

export const teamEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     addTeam: builder.mutation<Team, { name: string; owner_id: string; board_id?: string; members: string[] }>({
          async queryFn({ name, owner_id, board_id, members }) {
               try {
                    const { data, error: teamErr } = await supabase
                         .from('teams')
                         .insert({
                              name,
                              owner_id,
                              board_id: board_id ?? null,
                         })
                         .select('*')
                         .single();
                    if (teamErr || !data) throw teamErr || new Error('Failed to create team');
                    const newTeam = data;
                    const teamId = newTeam.id;
                    const uniqueMembers = Array.from(new Set([owner_id, ...members]));
                    const inserts = uniqueMembers.map((userId) => ({
                         team_id: teamId,
                         user_id: userId,
                    }));
                    const { data: insertedMembersData, error: membersErr } = await supabase
                         .from('team_members')
                         .insert(inserts)
                         .select('*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)');
                    if (membersErr) throw membersErr;
                    const insertedMembers = insertedMembersData ?? [];
                    const teamMembers: TeamMember[] = insertedMembers.map((r: RawTeamMember) => {
                         const userValue = r.user;
                         const u = Array.isArray(userValue) ? (userValue[0] as RawUser) : (userValue as RawUser);
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
                                   role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                                   created_at: u.created_at,
                              },
                         };
                    });
                    const resultTeam: Team = {
                         id: teamId,
                         name: newTeam.name,
                         board_id: newTeam.board_id ?? null,
                         owner_id: newTeam.owner_id,
                         users: teamMembers,
                         created_at: newTeam.created_at,
                    };
                    return { data: resultTeam };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.addTeam] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (result) => [{ type: 'TeamsList', id: 'LIST' }, result ? { type: 'Team' as const, id: result.id } : null].filter(Boolean) as Array<{ type: string; id: string }>,
     }),

     deleteTeam: builder.mutation<{ id: string }, string>({
          async queryFn(teamId) {
               try {
                    const { error: delMembersErr } = await getSupabase().from('team_members').delete().eq('team_id', teamId);
                    if (delMembersErr) throw delMembersErr;
                    const { error: delTeamErr } = await getSupabase().from('teams').delete().eq('id', teamId);
                    if (delTeamErr) throw delTeamErr;
                    return { data: { id: teamId } };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.deleteTeam] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_result, _error, id) => [
               { type: 'TeamsList', id: 'LIST' },
               { type: 'Team' as const, id },
          ],
     }),

     getTeams: builder.query<Team[], string>({
          async queryFn(ownerId) {
               try {
                    const { data, error: teamsErr } = await getSupabase().from('teams').select('*').eq('owner_id', ownerId);
                    if (teamsErr) throw teamsErr;
                    const teamsRaw = data ?? [];
                    const teams: Team[] = [];
                    for (const t of teamsRaw) {
                         const { data: membersData, error: membersErr } = await supabase
                              .from('team_members')
                              .select('*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)')
                              .eq('team_id', t.id);
                         if (membersErr) throw membersErr;
                         const membersRaw = membersData ?? [];
                         const members: TeamMember[] = membersRaw.map((r: RawTeamMember) => {
                              const userValue = r.user;
                              const u = Array.isArray(userValue) ? (userValue[0] as RawUser) : (userValue as RawUser);
                              const tm: TeamMember = {
                                   id: r.id,
                                   team_id: r.team_id,
                                   user_id: r.user_id,
                                   created_at: r.created_at,
                                   user: {
                                        id: u.id,
                                        name: u.name,
                                        email: u.email,
                                        image: u.image,
                                        role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                                        created_at: u.created_at,
                                   },
                              };
                              return tm;
                         });
                         teams.push({
                              id: t.id,
                              name: t.name,
                              board_id: t.board_id ?? null,
                              owner_id: t.owner_id,
                              users: members,
                              created_at: t.created_at,
                         });
                    }
                    return { data: teams };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getTeams] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => (result ? [{ type: 'TeamsList', id: 'LIST' }, ...result.map((team) => ({ type: 'Team' as const, id: team.id }))] : [{ type: 'TeamsList', id: 'LIST' }]),
     }),

     getMyTeams: builder.query<Team[], string>({
          async queryFn(userId) {
               try {
                    const { data: ownedData, error: ownedErr } = await getSupabase().from('teams').select('*').eq('owner_id', userId);
                    if (ownedErr) throw ownedErr;
                    const ownedRaw = ownedData ?? [];

                    const { data: linkData, error: linkErr } = await getSupabase().from('team_members').select('team_id').eq('user_id', userId);
                    if (linkErr) throw linkErr;
                    const memberLinks = linkData ?? [];

                    const teamIds = memberLinks.map((l) => l.team_id);
                    let memberRaw: Array<{ id: string; name: string; board_id: string | null; owner_id: string; created_at?: string }> = [];
                    if (teamIds.length > 0) {
                         const { data: memberData, error } = await getSupabase().from('teams').select('*').in('id', teamIds);
                         if (error) throw error;
                         memberRaw = memberData ?? [];
                    }

                    const map = new Map<string, { id: string; name: string; board_id: string | null; owner_id: string; created_at?: string }>();
                    [...ownedRaw, ...memberRaw].forEach((t) => map.set(t.id, t));
                    const allTeams = Array.from(map.values());

                    const result: Team[] = await Promise.all(
                         allTeams.map(async (t) => {
                              const { data: membersData, error: mErr } = await supabase
                                   .from('team_members')
                                   .select('*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)')
                                   .eq('team_id', t.id);
                              if (mErr) throw mErr;
                              const membersRaw = membersData ?? [];
                              const users = membersRaw.map((r: RawTeamMember) => {
                                   const userValue = r.user;
                                   const u = Array.isArray(userValue) ? (userValue[0] as RawUser) : (userValue as RawUser);
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
                                             role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
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
                                   updated_at: undefined,
                              } as Team;
                         }),
                    );

                    return { data: result };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getMyTeams] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result) => (result ? [{ type: 'TeamsList', id: 'LIST' }, ...result.map((t) => ({ type: 'Team' as const, id: t.id }))] : [{ type: 'TeamsList', id: 'LIST' }]),
     }),

     getTeamMembersByBoardId: builder.query<User[], string>({
          async queryFn(boardId) {
               try {
                    const { data: boardTeamsData, error: btErr } = await getSupabase().from('teams').select('id').eq('board_id', boardId);
                    if (btErr) throw btErr;
                    const boardTeams = boardTeamsData ?? [];

                    const teamIds = boardTeams.map((t) => t.id);
                    if (teamIds.length === 0) {
                         return { data: [] };
                    }

                    const { data: rawData, error: mErr } = await supabase
                         .from('team_members')
                         .select('user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)')
                         .in('team_id', teamIds);
                    if (mErr) throw mErr;

                    const raw = rawData ?? [];

                    const map = new Map<string, User>();
                    raw.forEach((r: { user?: RawUser | RawUser[] }) => {
                         const userValue = r.user;
                         const u = Array.isArray(userValue) ? (userValue[0] as RawUser) : (userValue as RawUser);
                         if (u && !map.has(u.id)) {
                              map.set(u.id, {
                                   id: u.id,
                                   name: u.name,
                                   email: u.email,
                                   image: u.image,
                                   role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                                   created_at: u.created_at,
                              });
                         }
                    });

                    return { data: Array.from(map.values()) };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getTeamMembersByBoardId] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (result, _error, boardId) =>
               result ? [{ type: 'TeamMember' as const, id: boardId }, ...result.map((u) => ({ type: 'TeamMember' as const, id: u.id }))] : [{ type: 'TeamMember', id: boardId }],
     }),

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
                    const updPayload: Record<string, unknown> = {};
                    if (name !== undefined) updPayload.name = name;
                    if (board_id !== undefined) updPayload.board_id = board_id;
                    const { data, error: updErr } = await getSupabase().from('teams').update(updPayload).eq('id', id).select('*').single();
                    if (updErr || !data) throw updErr || new Error('Failed to update team');
                    const updatedTeam = data;

                    const { data: existingMembersData, error: existErr } = await getSupabase().from('team_members').select('*').eq('team_id', id);
                    if (existErr) throw existErr;
                    const existingMembersRaw = existingMembersData ?? [];
                    const existingUserIds = existingMembersRaw.map((r) => r.user_id);
                    const uniqueMembers = Array.from(new Set([owner_id, ...members]));
                    const toRemove = existingUserIds.filter((uid) => !uniqueMembers.includes(uid));
                    if (toRemove.length > 0) {
                         const { error: delErr } = await getSupabase().from('team_members').delete().eq('team_id', id).in('user_id', toRemove);
                         if (delErr) throw delErr;
                    }
                    const toAdd = uniqueMembers.filter((uid) => !existingUserIds.includes(uid));
                    if (toAdd.length > 0) {
                         const inserts = toAdd.map((userId) => ({
                              team_id: id,
                              user_id: userId,
                         }));
                         const { error: insertErr } = await getSupabase().from('team_members').insert(inserts).select('*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)');
                         if (insertErr) throw insertErr;
                    }
                    const { data: finalMembersData, error: finalErr } = await supabase
                         .from('team_members')
                         .select('*, user:users!team_members_user_id_fkey(id,name,email,image,role,created_at)')
                         .eq('team_id', id);
                    if (finalErr) throw finalErr;
                    const finalMembersRaw = finalMembersData ?? [];
                    const teamMembers: TeamMember[] = finalMembersRaw.map((r: RawTeamMember) => {
                         const userValue = r.user;
                         const u = Array.isArray(userValue) ? (userValue[0] as RawUser) : (userValue as RawUser);
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
                                   role: u.role as 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | undefined,
                                   created_at: u.created_at,
                              },
                         };
                    });
                    const resultTeam: Team = {
                         id: updatedTeam.id,
                         name: updatedTeam.name,
                         board_id: updatedTeam.board_id ?? null,
                         owner_id: updatedTeam.owner_id,
                         users: teamMembers,
                         created_at: updatedTeam.created_at,
                    };
                    return { data: resultTeam };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.updateTeam] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (result) => [{ type: 'TeamsList', id: 'LIST' }, result ? { type: 'Team' as const, id: result.id } : null].filter(Boolean) as Array<{ type: string; id: string }>,
     }),

     updateTeamBoards: builder.mutation<{ teamId: string; boardIds: string[] }, { teamId: string; boardIds: string[] }>({
          async queryFn({ teamId, boardIds }) {
               try {
                    const { error: deleteErr } = await getSupabase().from('team_boards').delete().eq('team_id', teamId);
                    if (deleteErr) throw deleteErr;

                    const inserts = boardIds.map((boardId) => ({
                         team_id: teamId,
                         board_id: boardId,
                    }));

                    const { error: insertErr } = await getSupabase().from('team_boards').insert(inserts);

                    if (insertErr) throw insertErr;

                    return { data: { teamId, boardIds } };
               } catch (err) {
                    const error = err as Error;
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          invalidatesTags: (_res, _err, { teamId }) => [{ type: 'Team', id: teamId }],
     }),
});

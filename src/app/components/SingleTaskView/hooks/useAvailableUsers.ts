import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/api';

import type { User } from '@/app/types/globalTypes';

interface UseAvailableUsersResult {
     availableUsers: User[];
     fetchAvailableUsers: () => Promise<void>;
}

export const useAvailableUsers = (boardId?: string): UseAvailableUsersResult => {
     const [availableUsers, setAvailableUsers] = useState<User[]>([]);

     const fetchAvailableUsers = useCallback(async () => {
          try {
               if (!boardId) {
                    const { data, error } = await supabase.from('users').select('id, name, email, image').order('name');

                    if (error) throw error;
                    setAvailableUsers((data as User[]) || []);
                    return;
               }

               const { data: boardTeams, error: boardTeamsError } = await supabase.from('board_access').select('team_id').eq('board_id', boardId);

               if (boardTeamsError) {
                    console.error('Error fetching board teams:', boardTeamsError);
                    setAvailableUsers([]);
                    return;
               }

               if (!boardTeams || boardTeams.length === 0) {
                    setAvailableUsers([]);
                    return;
               }

               const teamIds = boardTeams.map((bt) => bt.team_id);

               type TeamMemberResponse = {
                    user_id: string;
                    users: User;
               };

               const { data: teamMembers, error: membersError } = await supabase
                    .from('team_members')
                    .select(
                         `
          user_id,
          users!inner(id, name, email, image)
        `,
                    )
                    .in('team_id', teamIds)
                    .returns<TeamMemberResponse[]>();

               if (membersError) {
                    console.error('Error fetching team members:', membersError);
                    setAvailableUsers([]);
                    return;
               }

               if (!teamMembers || teamMembers.length === 0) {
                    setAvailableUsers([]);
                    return;
               }

               const uniqueUsers: User[] = teamMembers.reduce((acc: User[], member: TeamMemberResponse) => {
                    const user = member.users;
                    if (user && !acc.some((u) => u.id === user.id)) {
                         acc.push({
                              id: user.id,
                              name: user.name ?? null,
                              email: user.email ?? null,
                              image: user.image ?? null,
                         });
                    }
                    return acc;
               }, []);

               setAvailableUsers(uniqueUsers);
          } catch (error) {
               console.error('Error fetching available users:', error);
               setAvailableUsers([]);
          }
     }, [boardId]);

     useEffect(() => {
          fetchAvailableUsers();
     }, [fetchAvailableUsers]);

     return { availableUsers, fetchAvailableUsers };
};

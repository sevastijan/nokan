import { useGetUserRoleQuery } from '@/app/store/apiSlice';
import { useCurrentUser } from './useCurrentUser';

export const useHasManagementAccess = (): boolean => {
     const { currentUser } = useCurrentUser();
     const userEmail = currentUser?.email || '';

     const { data: userRole } = useGetUserRoleQuery(userEmail, {
          skip: !userEmail,
     });

     return userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';
};

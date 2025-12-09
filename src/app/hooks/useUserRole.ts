import { useSession } from 'next-auth/react';
import { useGetUserRoleQuery } from '@/app/store/apiSlice';
import { UserRole } from '../types/globalTypes';

/**
 * Custom hook to get the current user's role with proper loading states
 * Supports all roles: OWNER | PROJECT_MANAGER | MEMBER | CLIENT
 */
export const useUserRole = () => {
     const { data: session, status } = useSession();
     const email = session?.user?.email ?? '';

     const {
          data: roleFromApi,
          error: roleError,
          isLoading: roleLoading,
          isFetching,
     } = useGetUserRoleQuery(email, {
          skip: !email,
     });

     // Safely determine the user's role
     // roleFromApi comes from RTK Query → can be undefined while loading
     const userRole: UserRole | null = email
          ? roleFromApi ?? null // will be null until data arrives
          : null;

     // Loading state: true while NextAuth session or role is being fetched
     const loading = status === 'loading' || (email && (roleLoading || isFetching));

     // Helper: does user have management privileges?
     const hasManagementAccess = (): boolean => {
          return userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';
     };

     return {
          /** The actual role, or null if not loaded or no session */
          userRole,

          /** True while session or role is loading */
          loading,

          /** Any error from the role query */
          error: roleError,

          // Convenience booleans (safe even if userRole is null)
          hasManagementAccess,
          isOwner: userRole === 'OWNER',
          isProjectManager: userRole === 'PROJECT_MANAGER',
          isMember: userRole === 'MEMBER',
          isClient: userRole === 'CLIENT',
     };
};

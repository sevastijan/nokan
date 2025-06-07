import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER';

export const useUserRole = () => {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
        } else {
          setUserRole(data?.role || 'MEMBER');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session]);

  const hasManagementAccess = () => {
    return userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';
  };

  return {
    userRole,
    loading,
    hasManagementAccess,
    isOwner: userRole === 'OWNER',
    isProjectManager: userRole === 'PROJECT_MANAGER',
    isMember: userRole === 'MEMBER'
  };
};
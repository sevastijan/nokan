'use client';

import { useSession } from 'next-auth/react';
import { useUserRole } from '../hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TeamManagement from '../components/TeamManagement/TeamManagement';

const TeamManagementPage = () => {
     const { data: session, status } = useSession();
     const { hasManagementAccess, loading } = useUserRole();
     const router = useRouter();

     useEffect(() => {
          if (status === 'unauthenticated') {
               router.push('/');
               return;
          }

          if (!loading && !hasManagementAccess()) {
               router.push('/dashboard');
               return;
          }
     }, [status, hasManagementAccess, loading, router]);

     if (status === 'loading' || loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="text-lg">Loading...</div>
               </div>
          );
     }

     if (!session || !hasManagementAccess()) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="text-lg text-red-600">Access Denied</div>
               </div>
          );
     }

     return <TeamManagement />;
};

export default TeamManagementPage;

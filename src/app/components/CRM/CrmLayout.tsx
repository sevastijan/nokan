'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import Loader from '@/app/components/Loader';

interface CrmLayoutProps {
  children: React.ReactNode;
}

const CrmLayout = ({ children }: CrmLayoutProps) => {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });
  const role = currentUser?.role ?? null;
  const roleLoading = authStatus === 'loading' || userLoading;

  useEffect(() => {
    if (!roleLoading && role !== 'OWNER') {
      router.replace('/dashboard');
    }
  }, [role, roleLoading, router]);

  if (roleLoading) return <Loader />;
  if (role !== 'OWNER') return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="px-4 sm:px-6 py-6">
        {children}
      </div>
    </div>
  );
};

export default CrmLayout;

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import Loader from '@/app/components/Loader';
import PageTree from './PageTree';

interface DocsLayoutProps {
  children: React.ReactNode;
  activePageId?: string;
}

const DocsLayout = ({ children, activePageId }: DocsLayoutProps) => {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser, isLoading } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });
  const role = currentUser?.role ?? null;

  useEffect(() => {
    if (!isLoading && role !== 'OWNER') router.replace('/dashboard');
  }, [role, isLoading, router]);

  if (isLoading || authStatus === 'loading') return <Loader />;
  if (role !== 'OWNER') return null;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-900 overflow-y-auto h-[calc(100vh-2.75rem)] md:h-screen sticky top-11 md:top-0">
        <PageTree activePageId={activePageId} userId={currentUser?.id} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
};

export default DocsLayout;

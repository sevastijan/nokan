'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import { DM_Sans } from 'next/font/google';
import { ArrowLeft } from 'lucide-react';
import Loader from '@/app/components/Loader';
import PageTree from './PageTree';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

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

  const hasActivePage = !!activePageId;

  return (
    <div className={`min-h-screen bg-slate-900 flex ${dmSans.className}`}>
      {/* Desktop: sidebar always visible */}
      <div className="hidden md:block w-64 shrink-0 border-r border-slate-800/80 bg-slate-900 overflow-y-auto h-screen sticky top-0">
        <PageTree activePageId={activePageId} userId={currentUser?.id} />
      </div>

      {/* Mobile: show page tree OR content, not both */}
      <div className="md:hidden flex-1 min-w-0">
        {hasActivePage ? (
          <>
            {/* Back button to page list */}
            <div className="sticky top-11 z-20 bg-slate-900 border-b border-slate-800/50 px-3 py-2 mt-11">
              <button
                onClick={() => router.push('/docs')}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Dokumenty
              </button>
            </div>
            <div className="bg-[#0a0f1a]">{children}</div>
          </>
        ) : (
          /* Full screen page tree on mobile */
          <div className="bg-slate-900 min-h-[calc(100vh-2.75rem)]">
            <PageTree activePageId={activePageId} userId={currentUser?.id} />
          </div>
        )}
      </div>

      {/* Desktop: content */}
      <div className="hidden md:block flex-1 min-w-0 overflow-y-auto bg-[#0a0f1a]">
        {children}
      </div>
    </div>
  );
};

export default DocsLayout;

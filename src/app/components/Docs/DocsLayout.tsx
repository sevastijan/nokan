'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import { DM_Sans } from 'next/font/google';
import { Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on page navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [activePageId]);

  useEffect(() => {
    if (!isLoading && role !== 'OWNER') router.replace('/dashboard');
  }, [role, isLoading, router]);

  if (isLoading || authStatus === 'loading') return <Loader />;
  if (role !== 'OWNER') return null;

  return (
    <div className={`min-h-screen bg-slate-900 flex ${dmSans.className}`}>
      {/* Mobile sidebar toggle — small icon, not conflicting with Navbar */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 right-4 z-50 md:hidden p-3 bg-brand-600 rounded-full text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar — hidden on mobile, toggle with button */}
      <div className={`
        fixed md:relative z-40
        w-64 shrink-0 border-r border-slate-800/80 bg-slate-900
        overflow-y-auto h-[calc(100vh-2.75rem)] md:h-screen
        top-11 md:top-0 left-0
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <PageTree activePageId={activePageId} userId={currentUser?.id} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-[#0a0f1a]">{children}</div>
    </div>
  );
};

export default DocsLayout;

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { DM_Sans } from 'next/font/google';
import { ArrowLeft } from 'lucide-react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import PageTree from './PageTree';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

interface BoardDocsLayoutProps {
  boardId: string;
  activePageId?: string;
  children?: React.ReactNode;
}

const BoardDocsLayout = ({ boardId, activePageId, children }: BoardDocsLayoutProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, { skip: !session });
  const hasActivePage = !!activePageId;

  return (
    <div className={`min-h-screen bg-slate-900 flex ${dmSans.className}`}>
      {/* Desktop: sidebar always visible */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800/80 bg-slate-900 overflow-y-auto h-screen sticky top-0">
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => router.push(`/board/${boardId}`)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} />
            {t('docs.backToBoard', 'Board')}
          </button>
        </div>
        <PageTree activePageId={activePageId} userId={currentUser?.id} boardId={boardId} />
      </div>

      {/* Mobile: show page tree OR content, not both */}
      <div className="md:hidden flex-1 min-w-0">
        {hasActivePage ? (
          <>
            <div className="bg-slate-900 border-b border-slate-800/50 px-3 py-2 mt-3">
              <button
                onClick={() => router.push(`/board/${boardId}/docs`)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                {t('docs.title', 'Dokumenty')}
              </button>
            </div>
            <div className="bg-[#0a0f1a]">{children}</div>
          </>
        ) : (
          <div className="bg-slate-900 min-h-[calc(100vh-2.75rem)]">
            <div className="px-3 pt-3 pb-1">
              <button
                onClick={() => router.push(`/board/${boardId}`)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft size={14} />
                {t('docs.backToBoard', 'Board')}
              </button>
            </div>
            <PageTree activePageId={activePageId} userId={currentUser?.id} boardId={boardId} />
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

export default BoardDocsLayout;

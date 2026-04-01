'use client';

import { useParams } from 'next/navigation';
import { useGetWikiPageByIdQuery, useGetCurrentUserQuery } from '@/app/store/apiSlice';
import { useSession } from 'next-auth/react';
import BoardDocsLayout from '@/app/components/Docs/BoardDocsLayout';
import PageEditor from '@/app/components/Docs/PageEditor';
import Loader from '@/app/components/Loader';

export default function BoardDocPage() {
  const { id, pageId } = useParams<{ id: string; pageId: string }>();
  const { data: session } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, { skip: !session });
  const { data: page, isLoading } = useGetWikiPageByIdQuery(pageId, { skip: !pageId });

  if (isLoading) {
    return (
      <BoardDocsLayout boardId={id} activePageId={pageId}>
        <Loader />
      </BoardDocsLayout>
    );
  }

  if (!page) {
    return (
      <BoardDocsLayout boardId={id}>
        <div className="p-8 text-slate-400">Strona nie znaleziona</div>
      </BoardDocsLayout>
    );
  }

  return (
    <BoardDocsLayout boardId={id} activePageId={pageId}>
      <PageEditor page={page} userId={currentUser?.id} boardId={id} />
    </BoardDocsLayout>
  );
}

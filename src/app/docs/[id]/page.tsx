'use client';

import { useParams } from 'next/navigation';
import {
  useGetWikiPageByIdQuery,
  useGetCurrentUserQuery,
} from '@/app/store/apiSlice';
import { useSession } from 'next-auth/react';
import DocsLayout from '@/app/components/Docs/DocsLayout';
import PageEditor from '@/app/components/Docs/PageEditor';
import Loader from '@/app/components/Loader';

export default function DocsPageDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, {
    skip: !session,
  });
  const { data: page, isLoading } = useGetWikiPageByIdQuery(id, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <DocsLayout activePageId={id}>
        <Loader />
      </DocsLayout>
    );
  }

  if (!page) {
    return (
      <DocsLayout activePageId={id}>
        <div className="p-8 text-slate-400">Strona nie znaleziona</div>
      </DocsLayout>
    );
  }

  return (
    <DocsLayout activePageId={id}>
      <PageEditor page={page} userId={currentUser?.id} />
    </DocsLayout>
  );
}

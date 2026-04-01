'use client';

import { useParams } from 'next/navigation';
import BoardDocsLayout from '@/app/components/Docs/BoardDocsLayout';

export default function BoardDocsPage() {
  const { id } = useParams<{ id: string }>();
  return <BoardDocsLayout boardId={id} />;
}

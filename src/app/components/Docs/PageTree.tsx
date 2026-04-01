'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import {
  useGetWikiPagesQuery,
  useGetWikiBoardPagesQuery,
  useCreateWikiPageMutation,
  useCreateWikiBoardPageMutation,
} from '@/app/store/apiSlice';
import type { WikiPage } from '@/app/types/wikiTypes';
import PageTreeItem from './PageTreeItem';

interface PageTreeProps {
  activePageId?: string;
  userId?: string;
  boardId?: string;
}

function buildTree(pages: WikiPage[]): WikiPage[] {
  const map = new Map<string, WikiPage>();
  const roots: WikiPage[] = [];

  pages.forEach((p) => map.set(p.id, { ...p, children: [] }));

  map.forEach((page) => {
    if (page.parent_id && map.has(page.parent_id)) {
      map.get(page.parent_id)!.children!.push(page);
    } else {
      roots.push(page);
    }
  });

  const sortChildren = (nodes: WikiPage[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => {
      if (n.children?.length) sortChildren(n.children);
    });
  };
  sortChildren(roots);

  return roots;
}

function filterTree(nodes: WikiPage[], query: string): WikiPage[] {
  const lower = query.toLowerCase();
  return nodes.reduce<WikiPage[]>((acc, node) => {
    const childMatches = node.children?.length
      ? filterTree(node.children, query)
      : [];
    if (
      node.title.toLowerCase().includes(lower) ||
      childMatches.length > 0
    ) {
      acc.push({ ...node, children: childMatches.length > 0 ? childMatches : node.children });
    }
    return acc;
  }, []);
}

const PageTree = ({ activePageId, userId, boardId }: PageTreeProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: globalPages = [] } = useGetWikiPagesQuery(undefined, { skip: !!boardId });
  const { data: boardPages = [] } = useGetWikiBoardPagesQuery(boardId!, { skip: !boardId });
  const pages = boardId ? boardPages : globalPages;
  const [createPage] = useCreateWikiPageMutation();
  const [createBoardPage] = useCreateWikiBoardPageMutation();
  const [search, setSearch] = useState('');

  const tree = useMemo(() => buildTree(pages), [pages]);

  const filtered = useMemo(
    () => (search.trim() ? filterTree(tree, search.trim()) : tree),
    [tree, search],
  );

  const handleNewPage = useCallback(async () => {
    try {
      let result;
      if (boardId) {
        result = await createBoardPage({
          title: t('docs.newPage'),
          created_by: userId,
          board_id: boardId,
        }).unwrap();
        router.push(`/board/${boardId}/docs/${result.id}`);
      } else {
        result = await createPage({
          title: t('docs.newPage'),
          created_by: userId,
        }).unwrap();
        router.push(`/docs/${result.id}`);
      }
    } catch {
      // silently fail – toast is handled at API level
    }
  }, [createPage, createBoardPage, userId, boardId, router, t]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t('docs.title')}
        </span>
        <button
          onClick={handleNewPage}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title={t('docs.newPage')}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('docs.search')}
            className="w-full bg-slate-800/60 text-sm text-slate-300 placeholder-slate-600 rounded px-2 py-1.5 pl-7 border border-slate-700/50 outline-none focus:border-slate-600 transition-colors"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-600 px-3 py-4 text-center">
            {t('docs.noPages')}
          </p>
        )}
        {filtered.map((page) => (
          <PageTreeItem
            key={page.id}
            page={page}
            level={0}
            activePageId={activePageId}
            userId={userId}
            boardId={boardId}
          />
        ))}
      </div>
    </div>
  );
};

export default PageTree;

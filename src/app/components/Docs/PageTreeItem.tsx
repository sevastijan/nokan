'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateWikiPageMutation,
  useCreateWikiBoardPageMutation,
  useDeleteWikiPageMutation,
} from '@/app/store/apiSlice';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import type { WikiPage } from '@/app/types/wikiTypes';

interface PageTreeItemProps {
  page: WikiPage;
  level: number;
  activePageId?: string;
  userId?: string;
  boardId?: string;
}

const PageTreeItem = ({ page, level, activePageId, userId, boardId }: PageTreeItemProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [createPage] = useCreateWikiPageMutation();
  const [createBoardPage] = useCreateWikiBoardPageMutation();
  const [deletePage] = useDeleteWikiPageMutation();

  const hasChildren = (page.children?.length ?? 0) > 0;
  const isActive = page.id === activePageId;

  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  const basePath = boardId ? `/board/${boardId}/docs` : '/docs';

  const handleClick = useCallback(() => {
    router.push(`${basePath}/${page.id}`);
  }, [router, page.id, basePath]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    },
    [],
  );

  const handleAddSubpage = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      try {
        let result;
        if (boardId) {
          result = await createBoardPage({
            title: t('docs.newPage'),
            parent_id: page.id,
            created_by: userId,
            board_id: boardId,
          }).unwrap();
        } else {
          result = await createPage({
            title: t('docs.newPage'),
            parent_id: page.id,
            created_by: userId,
          }).unwrap();
        }
        setExpanded(true);
        router.push(`${basePath}/${result.id}`);
      } catch {
        // handled by API layer
      }
    },
    [createPage, createBoardPage, page.id, userId, boardId, basePath, router, t],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      if (!confirm(t('docs.deleteConfirm'))) return;
      try {
        await deletePage(page.id).unwrap();
        toast.success(t('docs.deleted'));
        if (isActive) router.push(basePath);
      } catch {
        // handled by API layer
      }
    },
    [deletePage, page.id, isActive, basePath, router, t],
  );

  return (
    <div>
      {/* Row */}
      <div
        onClick={handleClick}
        className={`group flex items-center gap-1 py-1 pr-1 rounded cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-600/10 text-white'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand / collapse */}
        <button
          onClick={handleToggle}
          className={`shrink-0 p-0.5 rounded hover:bg-slate-700/50 transition-transform ${
            hasChildren ? 'visible' : 'invisible'
          } ${expanded ? 'rotate-90' : ''}`}
        >
          <ChevronRight size={14} />
        </button>

        {/* Icon */}
        <span className="shrink-0 text-sm">
          {page.icon || <FileText size={14} className="text-slate-500" />}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm truncate ml-1">{page.title}</span>

        {/* Menu trigger */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 transition-opacity"
          >
            <MoreHorizontal size={14} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 py-1 text-sm">
              <button
                onClick={handleAddSubpage}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Plus size={14} />
                {t('docs.addSubpage')}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <Trash2 size={14} />
                {t('docs.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {page.children!.map((child) => (
            <PageTreeItem
              key={child.id}
              page={child}
              level={level + 1}
              activePageId={activePageId}
              userId={userId}
              boardId={boardId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PageTreeItem;

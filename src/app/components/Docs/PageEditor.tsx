'use client';

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useUpdateWikiPageMutation, useCreateWikiPageMutation, useGetWikiPagesQuery } from '@/app/store/apiSlice';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import type { WikiPage } from '@/app/types/wikiTypes';
import dynamic from 'next/dynamic';

const EMOJI_OPTIONS = [
  '📄', '📝', '📋', '📌', '📎', '📂', '📁', '🗂️',
  '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒',
  '💡', '⭐', '🎯', '🚀', '🔥', '✨', '💎', '🏆',
  '🔧', '⚙️', '🛠️', '🔑', '🔒', '🔓', '📊', '📈',
  '💰', '💳', '🏦', '📱', '💻', '🖥️', '🌐', '📡',
  '👥', '👤', '🏢', '🏠', '📞', '✉️', '📮', '📦',
  '✅', '❌', '⚠️', 'ℹ️', '❓', '❗', '🔴', '🟢',
  '🎨', '🎬', '🎵', '📸', '🗓️', '⏰', '🔔', '💬',
];

const BlockNoteEditor = dynamic(() => import('./BlockNoteWrapper'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-slate-500">Ladowanie edytora...</div>
  ),
});

interface PageEditorProps {
  page: WikiPage;
  userId?: string;
}

const PageEditor = ({ page, userId }: PageEditorProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [updatePage] = useUpdateWikiPageMutation();
  const [createPage] = useCreateWikiPageMutation();
  const [title, setTitle] = useState(page.title);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const isNewPage = page.title === 'Nowa strona' || page.title === 'New page';

  const { data: allPages = [] } = useGetWikiPagesQuery();

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string; title: string; icon?: string | null }[] = [];
    let current = page;
    while (current.parent_id) {
      const parent = allPages.find((p) => p.id === current.parent_id);
      if (!parent) break;
      crumbs.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
      current = parent as typeof page;
    }
    return crumbs;
  }, [page, allPages]);

  useOutsideClick(emojiPickerRef, () => setEmojiOpen(false));

  const handleCreateSubpage = useCallback(async () => {
    try {
      const result = await createPage({
        title: 'Nowa strona',
        parent_id: page.id,
        created_by: userId,
      }).unwrap();
      return { id: result.id, title: result.title };
    } catch {
      return null;
    }
  }, [createPage, page.id, userId]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setEmojiOpen(false);
    updatePage({ id: page.id, data: { icon: emoji, updated_by: userId } });
  }, [page.id, updatePage, userId]);

  // Sync title when page changes
  useEffect(() => {
    setTitle(page.title);
  }, [page.id, page.title]);

  // Auto-focus title on new pages
  useEffect(() => {
    if (isNewPage && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [page.id, isNewPage]);

  const handleContentChange = useCallback(
    (content: unknown) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      setSaved(false);
      saveTimeout.current = setTimeout(async () => {
        await updatePage({
          id: page.id,
          data: { content, updated_by: userId },
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 1000);
    },
    [page.id, updatePage, userId],
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        await updatePage({
          id: page.id,
          data: { title: newTitle, updated_by: userId },
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 1000);
    },
    [page.id, updatePage, userId],
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Save indicator */}
      {saved && (
        <div className="fixed top-14 md:top-3 right-4 text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded z-40">
          {t('docs.autoSaved')}
        </div>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          <Link href="/docs" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Dokumenty
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-slate-600" />
              <Link
                href={`/docs/${crumb.id}`}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {crumb.icon && <span className="mr-0.5">{crumb.icon}</span>}
                {crumb.title}
              </Link>
            </span>
          ))}
          <ChevronRight size={12} className="text-slate-600" />
          <span className="text-xs text-slate-400">
            {page.icon && <span className="mr-0.5">{page.icon}</span>}
            {page.title}
          </span>
        </div>
      )}

      {/* Page icon + title */}
      <div className="mb-6 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" ref={emojiPickerRef}>
            <button
              onClick={() => setEmojiOpen(!emojiOpen)}
              className="text-3xl hover:bg-slate-800 rounded-lg p-1.5 transition-colors cursor-pointer"
            >
              {page.icon || '📄'}
            </button>
            {emojiOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 w-[280px]">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={() => {
              if (!title.trim()) {
                const defaultTitle = t('docs.untitled');
                setTitle(defaultTitle);
                updatePage({ id: page.id, data: { title: defaultTitle, updated_by: userId } });
              }
            }}
            className="flex-1 text-xl sm:text-2xl font-bold text-white bg-transparent border-none outline-none placeholder-slate-600 font-[inherit]"
            placeholder={t('docs.untitled')}
          />
        </div>
      </div>

      {/* BlockNote Editor */}
      <BlockNoteEditor
        key={page.id}
        initialContent={page.content}
        onChange={handleContentChange}
        onSaveImmediate={async (content: unknown) => {
          await updatePage({ id: page.id, data: { content, updated_by: userId } });
        }}
        onCreateSubpage={handleCreateSubpage}
      />
    </div>
  );
};

export default PageEditor;

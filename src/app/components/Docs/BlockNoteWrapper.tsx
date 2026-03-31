'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { BlockNoteEditor, filterSuggestionItems } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import { createHighlightPlugin } from 'prosemirror-highlight';
import { createParser } from 'prosemirror-highlight/lowlight';
import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);
const lowlightParser = createParser(lowlight);
const highlightPlugin = createHighlightPlugin({
  parser: lowlightParser,
  languageExtractor: (node) => {
    if (node.type.name === 'codeBlock') return node.attrs.language || null;
    return null;
  },
});

const LANGUAGES = [
  'plaintext', 'typescript', 'javascript', 'python', 'css', 'html',
  'json', 'bash', 'sql', 'yaml', 'go', 'rust', 'java', 'php',
];


interface BlockNoteWrapperProps {
  initialContent?: unknown;
  onChange: (content: unknown) => void;
  onSaveImmediate?: (content: unknown) => Promise<void>;
  onCreateSubpage?: () => Promise<{ id: string; title: string } | null>;
}

interface CodeBlockInfo {
  id: string;
  language: string;
  top: number;
}

const BlockNoteWrapper = ({ initialContent, onChange, onSaveImmediate, onCreateSubpage }: BlockNoteWrapperProps) => {
  const parsedContent = useMemo(() => {
    if (!initialContent) return undefined;
    try { return JSON.parse(JSON.stringify(initialContent)); } catch { return undefined; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/docs/upload', { method: 'POST', body: formData });
      const data = await res.json();
      return data.url;
    },
    _tiptapOptions: { extensions: [] },
  });

  // Custom slash menu items
  const getSlashMenuItems = useCallback(
    (editor: BlockNoteEditor<any>) => {
      const defaults = getDefaultReactSlashMenuItems(editor);
      const pageItem = {
        title: 'Podstrona',
        onItemClick: async () => {
          if (!onCreateSubpage) return;
          const subpage = await onCreateSubpage();
          if (subpage) {
            const cursor = editor.getTextCursorPosition().block;
            // Replace current block with a paragraph containing the link
            editor.updateBlock(cursor, {
              type: 'paragraph',
              content: [
                { type: 'text', text: '📄 ', styles: {} },
                {
                  type: 'link',
                  href: `/docs/${subpage.id}`,
                  content: [{ type: 'text', text: subpage.title, styles: {} }],
                },
              ],
            } as any);
            // Save immediately
            if (onSaveImmediate) {
              await onSaveImmediate(editor.document);
            }
            // Redirect to subpage
            window.location.href = `/docs/${subpage.id}`;
          }
        },
        aliases: ['page', 'subpage', 'strona', 'podstrona', 'link'],
        group: 'Inne',
        icon: <span style={{ fontSize: 14 }}>📄</span>,
        subtext: 'Utwórz podstronę i wstaw link',
      };
      return [...defaults, pageItem];
    },
    [onCreateSubpage],
  );

  // Register highlight plugin
  useEffect(() => {
    if (!editor) return;
    try {
      const pmEditor = (editor as unknown as { _tiptapEditor: { view: { state: { plugins: unknown[] }; updateState: (s: unknown) => void } } })._tiptapEditor;
      if (pmEditor?.view) {
        const state = pmEditor.view.state;
        const newState = (state as unknown as { reconfigure: (config: { plugins: unknown[] }) => unknown }).reconfigure({
          plugins: [...(state.plugins as unknown[]), highlightPlugin],
        });
        pmEditor.view.updateState(newState);
      }
    } catch { /* optional */ }
  }, [editor]);

  // Content change handler
  useEffect(() => {
    if (!editor) return;
    editor.onEditorContentChange(() => onChange(editor.document));
  }, [editor, onChange]);

  // Intercept clicks on /docs/ links to navigate in same tab
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.getAttribute('href')?.startsWith('/docs/')) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = target.getAttribute('href')!;
      }
    };
    const el = document.querySelector('.docs-editor');
    if (el) el.addEventListener('click', handleClick as EventListener);
    return () => {
      if (el) el.removeEventListener('click', handleClick as EventListener);
    };
  }, []);

  // Track code block positions for React-rendered language selectors
  const [codeBlocks, setCodeBlocks] = useState<CodeBlockInfo[]>([]);

  const scanCodeBlocks = useCallback(() => {
    const container = document.querySelector('.docs-editor');
    if (!container) return;

    const blocks: CodeBlockInfo[] = [];
    const containerRect = container.getBoundingClientRect();

    container.querySelectorAll('.bn-block-content[data-content-type="codeBlock"]').forEach((el) => {
      const outer = el.closest('.bn-block-outer');
      const blockId = outer?.getAttribute('data-id');
      if (!blockId) return;

      const rect = el.getBoundingClientRect();
      blocks.push({
        id: blockId,
        language: el.getAttribute('data-language') || 'plaintext',
        top: rect.top - containerRect.top,
      });
    });

    setCodeBlocks((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(blocks)) return prev;
      return blocks;
    });
  }, []);

  useEffect(() => {
    if (!editor) return;
    // Scan after render
    const t1 = setTimeout(scanCodeBlocks, 1000);
    const t2 = setTimeout(scanCodeBlocks, 3000);
    // Scan on content change
    editor.onEditorContentChange(() => {
      setTimeout(scanCodeBlocks, 200);
    });
    // Scan on scroll
    const editorEl = document.querySelector('.docs-editor');
    const handleScroll = () => scanCodeBlocks();
    editorEl?.closest('[class*="overflow"]')?.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      editorEl?.closest('[class*="overflow"]')?.removeEventListener('scroll', handleScroll);
    };
  }, [editor, scanCodeBlocks]);

  const handleLanguageChange = useCallback((blockId: string, newLang: string) => {
    if (!editor) return;
    editor.updateBlock(blockId, { props: { language: newLang } } as Parameters<typeof editor.updateBlock>[1]);
    // Rescan after update
    setTimeout(scanCodeBlocks, 300);
  }, [editor, scanCodeBlocks]);

  return (
    <div className="docs-editor" style={{ position: 'relative' }}>
      <BlockNoteView editor={editor} theme="dark" slashMenu={false}>
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(getSlashMenuItems(editor) as any, query)}
        />
      </BlockNoteView>

      {/* React-rendered language selectors */}
      {codeBlocks.map((block) => (
        <div
          key={block.id}
          style={{
            position: 'absolute',
            top: block.top + 8,
            left: 12,
            zIndex: 10,
          }}
        >
          <select
            value={block.language}
            onChange={(e) => handleLanguageChange(block.id, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="code-lang-sel"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <span className="code-lang-chevron">▾</span>
        </div>
      ))}

      <style>{`
        /* ── Base ── */
        .docs-editor .bn-container,
        .docs-editor .bn-editor,
        .docs-editor .bn-block-group,
        .docs-editor .bn-block-outer,
        .docs-editor .mantine-Paper-root {
          background: transparent !important;
          background-color: transparent !important;
        }
        .docs-editor .bn-block,
        .docs-editor .bn-block-content,
        .docs-editor [class*="BlockContent"],
        .docs-editor [class*="blockContent"],
        .docs-editor [data-content-type="table"] {
          background-color: transparent;
        }
        .docs-editor .bn-container { font-family: inherit !important; }

        /* ── Override BlockNote color CSS variables for dark theme ── */
        .docs-editor .bn-container[data-color-scheme=dark] {
          --bn-colors-highlights-gray-text: #9ca3af;
          --bn-colors-highlights-brown-text: #d4a574;
          --bn-colors-highlights-red-text: #f87171;
          --bn-colors-highlights-orange-text: #fb923c;
          --bn-colors-highlights-yellow-text: #fbbf24;
          --bn-colors-highlights-green-text: #4ade80;
          --bn-colors-highlights-blue-text: #60a5fa;
          --bn-colors-highlights-purple-text: #c084fc;
          --bn-colors-highlights-pink-text: #f472b6;
          --bn-colors-highlights-gray-background: rgba(156,163,175,0.15);
          --bn-colors-highlights-brown-background: rgba(212,165,116,0.15);
          --bn-colors-highlights-red-background: rgba(248,113,113,0.15);
          --bn-colors-highlights-orange-background: rgba(251,146,60,0.15);
          --bn-colors-highlights-yellow-background: rgba(251,191,36,0.15);
          --bn-colors-highlights-green-background: rgba(74,222,128,0.15);
          --bn-colors-highlights-blue-background: rgba(96,165,250,0.15);
          --bn-colors-highlights-purple-background: rgba(192,132,252,0.15);
          --bn-colors-highlights-pink-background: rgba(244,114,182,0.15);
        }
        .docs-editor .bn-editor { padding: 0 !important; color: #ffffff; }
        .docs-editor .bn-block-outer:first-child { margin-top: 0 !important; padding-top: 0 !important; }
        .docs-editor .bn-block-outer { margin-left: 0 !important; padding-left: 0 !important; }

        /* ── Code blocks ── */
        .docs-editor .bn-block-content[data-content-type="codeBlock"] {
          background: #141820 !important;
          border: none !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
        }
        .docs-editor .bn-block-content[data-content-type="codeBlock"] pre {
          background: transparent !important;
          border: none !important;
          padding: 2.25rem 1.25rem 1.25rem !important;
          font-size: 0.8125rem !important;
          font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace !important;
          line-height: 1.7 !important;
          color: #e2e8f0 !important;
        }
        /* Hide BlockNote's native select if present */
        .docs-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          display: none !important;
        }

        /* Language selector */
        .code-lang-sel {
          background: transparent;
          border: none;
          color: #475569;
          font-size: 0.7rem;
          padding: 0.15rem 0.25rem;
          cursor: pointer;
          outline: none;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          appearance: none;
          -webkit-appearance: none;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.15s;
        }
        .code-lang-sel:hover,
        .code-lang-sel:focus {
          color: #00a68b;
        }
        .code-lang-sel option {
          background: #0f172a;
          color: #e2e8f0;
          font-family: inherit;
          padding: 0.25rem;
        }
        .code-lang-chevron {
          color: #334155;
          font-size: 0.65rem;
          margin-left: -2px;
          pointer-events: none;
          transition: color 0.15s;
        }
        .code-lang-sel:hover + .code-lang-chevron {
          color: #00a68b;
        }

        /* Syntax highlighting */
        .docs-editor .hljs-keyword { color: #c084fc !important; }
        .docs-editor .hljs-string { color: #2ad4ab !important; }
        .docs-editor .hljs-number, .docs-editor .hljs-literal { color: #f59e0b !important; }
        .docs-editor .hljs-comment { color: #475569 !important; font-style: italic !important; }
        .docs-editor .hljs-function, .docs-editor .hljs-title { color: #60a5fa !important; }
        .docs-editor .hljs-built_in, .docs-editor .hljs-type { color: #f472b6 !important; }
        .docs-editor .hljs-variable, .docs-editor .hljs-params { color: #fb923c !important; }
        .docs-editor .hljs-operator, .docs-editor .hljs-punctuation { color: #94a3b8 !important; }
        .docs-editor .hljs-attr { color: #2ad4ab !important; }
        .docs-editor .hljs-tag { color: #c084fc !important; }
        .docs-editor .hljs-name { color: #f472b6 !important; }
        .docs-editor .hljs-property { color: #60a5fa !important; }

        /* Inline code */
        .docs-editor .bn-inline-content code {
          background: rgba(0,166,139,0.1) !important;
          color: #2ad4ab !important;
          padding: 0.125rem 0.5rem !important;
          border-radius: 0.375rem !important;
          font-size: 0.85em !important;
          font-family: 'JetBrains Mono','Fira Code',monospace !important;
          border: 1px solid rgba(0,166,139,0.15) !important;
        }

        /* ── Page link tiles (paragraphs starting with 📄) ── */
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"]) {
          background: #111520 !important;
          border: 1px solid #1e293b !important;
          border-radius: 0.5rem !important;
          padding: 0.625rem 0.875rem !important;
          transition: all 0.15s !important;
          cursor: pointer !important;
          width: fit-content !important;
          display: inline-flex !important;
          align-items: center !important;
          margin: 0.5rem 0 !important;
        }
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"]):hover {
          background: #1a2030 !important;
          border-color: #00a68b !important;
        }
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"]) a,
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"]) .bn-inline-content {
          color: #e2e8f0 !important;
          text-decoration: none !important;
          font-weight: 500 !important;
          transition: color 0.15s !important;
          cursor: pointer !important;
        }
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"]):hover a {
          color: #00a68b !important;
        }
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"])::after {
          content: '→' !important;
          color: #475569 !important;
          font-size: 0.875rem !important;
          margin-left: auto !important;
          padding-left: 0.5rem !important;
        }
        .docs-editor .bn-block-content[data-content-type="paragraph"]:has(.bn-inline-content > a[href^="/docs/"]):hover::after {
          color: #00a68b !important;
        }

        /* ── Headings ── */
        .docs-editor [data-content-type="heading"] {
          margin-top: 1.5rem !important; margin-bottom: 0.5rem !important;
          border-left: 3px solid #00a68b !important; padding-left: 0.625rem !important; border-radius: 0 !important;
        }
        .docs-editor [data-content-type="heading"] .bn-inline-content {
          font-style: normal !important; font-weight: 700 !important;
          letter-spacing: -0.02em !important; line-height: 1.3 !important;
        }
        .docs-editor [data-content-type="heading"][data-level="1"] .bn-inline-content { font-size: 1.5rem !important; }
        .docs-editor [data-content-type="heading"][data-level="2"] .bn-inline-content { font-size: 1.25rem !important; }
        .docs-editor [data-content-type="heading"][data-level="3"] .bn-inline-content { font-size: 1.0625rem !important; }
        .docs-editor [data-content-type="paragraph"] .bn-inline-content {
          font-size: 0.9375rem !important; color: #ffffff; line-height: 1.65 !important;
        }

        /* ── Links ── */
        .docs-editor a { color: #2ad4ab !important; text-decoration: underline !important; }

        /* ── Blockquote ── */
        .docs-editor [data-content-type="quote"], .docs-editor blockquote {
          background: rgba(99,102,241,0.05) !important; border-left: 3px solid #6366f1 !important;
          border-radius: 0 0.5rem 0.5rem 0 !important; padding: 0.75rem 1rem !important;
          color: #c7d2fe !important; font-style: normal !important;
        }

        /* ── Lists ── */
        .docs-editor [data-content-type="bulletListItem"] .bn-inline-content,
        .docs-editor [data-content-type="numberedListItem"] .bn-inline-content,
        .docs-editor [data-content-type="checkListItem"] .bn-inline-content {
          font-size: 0.9375rem !important; color: #ffffff;
        }
        .docs-editor .bn-block-content[data-content-type="bulletListItem"]::before { color: #00a68b !important; }
        .docs-editor .bn-block-content[data-content-type="numberedListItem"]::before { color: #00a68b !important; }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"] {
          appearance: none !important; -webkit-appearance: none !important;
          width: 18px !important; height: 18px !important;
          border: 2px solid #334155 !important; border-radius: 4px !important;
          background: transparent !important; cursor: pointer !important;
          position: relative !important; flex-shrink: 0 !important;
        }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"]:hover { border-color: #00a68b !important; }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"]:checked {
          background: #00a68b !important; border-color: #00a68b !important;
        }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"]:checked::after {
          content: '' !important; position: absolute !important; left: 5px !important; top: 1px !important;
          width: 5px !important; height: 10px !important;
          border: solid white !important; border-width: 0 2px 2px 0 !important; transform: rotate(45deg) !important;
        }
        .docs-editor [data-content-type="checkListItem"]:has(input:checked) .bn-inline-content {
          text-decoration: line-through !important; color: #64748b !important;
        }
        .docs-editor [data-content-type="checkListItem"] .bn-block-content {
          display: flex !important; align-items: center !important; gap: 0.5rem !important;
        }

        /* ── Tables ── */
        .docs-editor table { border-collapse: collapse !important; }
        .docs-editor th, .docs-editor td {
          border: 1px solid #334155 !important; padding: 0.5rem 0.75rem !important;
          font-size: 0.875rem !important; color: #ffffff !important;
        }
        .docs-editor th { background: #1e293b !important; font-weight: 600 !important; }
        .docs-editor td { background: transparent !important; }

        /* ── Menus ── */
        .docs-editor .bn-slash-menu, .docs-editor .bn-suggestion-menu,
        .docs-editor [class*="suggestionMenu"], .docs-editor .mantine-Menu-dropdown,
        .docs-editor [role="menu"], .docs-editor [role="listbox"] {
          background: #0f172a !important; border: 1px solid #1e293b !important;
          border-radius: 0.75rem !important; box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        }
        .docs-editor [role="option"], .docs-editor .mantine-Menu-item {
          color: #ffffff !important; background: transparent !important;
        }
        .docs-editor [role="option"]:hover, .docs-editor [role="option"][data-hovered="true"],
        .docs-editor .mantine-Menu-item:hover { background: #1e293b !important; }

        /* ── Toolbar ── */
        .docs-editor [class*="Toolbar"] {
          background: #0f172a !important; border: 1px solid #1e293b !important; border-radius: 0.5rem !important;
        }
        .docs-editor [class*="Toolbar"] button { color: #94a3b8 !important; background: transparent !important; }
        .docs-editor [class*="Toolbar"] button:hover { background: #1e293b !important; color: #f1f5f9 !important; }
        .docs-editor [class*="Toolbar"] button[data-active="true"] { color: #2ad4ab !important; }

        /* ── Side menu ── */
        .docs-editor .bn-side-menu, .docs-editor [class*="sideMenu"] { background: transparent !important; }
        .docs-editor .bn-side-menu button { color: #475569 !important; }
        .docs-editor .bn-side-menu button:hover { color: #94a3b8 !important; background: #1e293b !important; }
        .docs-editor [class*="dragHandleMenu"] { background: #0f172a !important; border: 1px solid #1e293b !important; }

        /* ── Placeholder ── */
        .docs-editor .bn-block-content::before, .docs-editor .bn-inline-content::before,
        .docs-editor [class*="isEmpty"]::before { color: #475569 !important; font-style: normal !important; }

        /* ── Images ── */
        .docs-editor [data-content-type="image"] img { border-radius: 0.5rem !important; }

        /* ── Panels ── */
        .docs-editor [class*="linkToolbar"], .docs-editor [class*="filePanel"] {
          background: #0f172a !important; border: 1px solid #1e293b !important;
        }
        .docs-editor [class*="linkToolbar"] input, .docs-editor [class*="filePanel"] input {
          background: #1e293b !important; border: 1px solid #334155 !important; color: #ffffff !important;
        }
        .docs-editor .mantine-Popover-dropdown, .docs-editor .mantine-Tooltip-tooltip {
          background: #0f172a !important; border: 1px solid #1e293b !important; color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default BlockNoteWrapper;

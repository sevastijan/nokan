'use client';

import { useEffect, useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import 'highlight.js/styles/github-dark.css';

interface BlockNoteWrapperProps {
  initialContent?: unknown;
  onChange: (content: unknown) => void;
}

const BlockNoteWrapper = ({ initialContent, onChange }: BlockNoteWrapperProps) => {
  const parsedContent = useMemo(() => {
    if (!initialContent) return undefined;
    try {
      return JSON.parse(JSON.stringify(initialContent));
    } catch {
      return undefined;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only parse once on mount

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/docs/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.url;
    },
  });

  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      onChange(editor.document);
    };

    editor.onEditorContentChange(handler);
  }, [editor, onChange]);

  return (
    <div className="docs-editor">
      <BlockNoteView editor={editor} theme="dark" />
      <style>{`
        /* ── Base: transparent background everywhere ── */
        .docs-editor .bn-container,
        .docs-editor .bn-editor,
        .docs-editor .bn-block-group,
        .docs-editor .bn-block-outer,
        .docs-editor .bn-block,
        .docs-editor .bn-block-content,
        .docs-editor [class*="BlockContent"],
        .docs-editor [class*="blockContent"],
        .docs-editor .mantine-Paper-root,
        .docs-editor [data-content-type="table"] {
          background: transparent !important;
          background-color: transparent !important;
        }
        .docs-editor .bn-container {
          font-family: inherit !important;
        }
        .docs-editor .bn-editor {
          padding: 0 !important;
          color: #ffffff !important;
        }
        .docs-editor .bn-block-outer:first-child {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        .docs-editor .bn-block-outer {
          margin-left: 0 !important;
          padding-left: 0 !important;
        }

        /* ── Typography: match app style ── */
        .docs-editor [data-content-type="heading"] {
          margin-top: 1.5rem !important;
          margin-bottom: 0.5rem !important;
          border-left: 3px solid #00a68b !important;
          padding-left: 0.625rem !important;
          border-radius: 0 !important;
        }
        .docs-editor [data-content-type="heading"] .bn-inline-content {
          font-style: normal !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          letter-spacing: -0.02em !important;
          line-height: 1.3 !important;
        }
        .docs-editor [data-content-type="heading"][data-level="1"] .bn-inline-content {
          font-size: 1.5rem !important;
        }
        .docs-editor [data-content-type="heading"][data-level="2"] .bn-inline-content {
          font-size: 1.25rem !important;
        }
        .docs-editor [data-content-type="heading"][data-level="3"] .bn-inline-content {
          font-size: 1.0625rem !important;
        }
        .docs-editor [data-content-type="paragraph"] .bn-inline-content {
          font-size: 0.9375rem !important;
          color: #ffffff !important;
          line-height: 1.65 !important;
        }

        /* ── Links ── */
        .docs-editor a {
          color: #2ad4ab !important;
          text-decoration: underline !important;
        }
        .docs-editor a:hover {
          color: #5ceac6 !important;
        }

        /* ── Code blocks ── */
        .docs-editor [data-content-type="codeBlock"] {
          background: #0c0e14 !important;
          border: none !important;
          border-radius: 0.75rem !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .docs-editor [data-content-type="codeBlock"] pre,
        .docs-editor [data-content-type="codeBlock"] code {
          background: transparent !important;
          border: none !important;
          padding: 1.25rem !important;
          font-size: 0.8125rem !important;
          font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace !important;
          line-height: 1.7 !important;
          color: #e2e8f0 !important;
          border-radius: 0 !important;
        }
        /* Override highlight.js theme bg to match our code block */
        .docs-editor .hljs {
          background: transparent !important;
        }
        /* Language selector in code block */
        .docs-editor [data-content-type="codeBlock"] select {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #94a3b8 !important;
          border-radius: 0.375rem !important;
          font-size: 0.75rem !important;
          padding: 0.25rem 0.5rem !important;
        }
        /* Inline code */
        .docs-editor code:not(pre code) {
          background: rgba(0, 166, 139, 0.1) !important;
          color: #2ad4ab !important;
          padding: 0.125rem 0.5rem !important;
          border-radius: 0.375rem !important;
          font-size: 0.85em !important;
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
          border: 1px solid rgba(0, 166, 139, 0.15) !important;
        }

        /* ── Blockquote ── */
        .docs-editor [data-content-type="quote"],
        .docs-editor blockquote {
          background: rgba(99, 102, 241, 0.05) !important;
          border-left: 3px solid #6366f1 !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
          padding: 0.75rem 1rem !important;
          margin: 0.5rem 0 !important;
          color: #c7d2fe !important;
          font-style: normal !important;
        }

        /* ── Lists ── */
        .docs-editor [data-content-type="bulletListItem"] .bn-inline-content,
        .docs-editor [data-content-type="numberedListItem"] .bn-inline-content,
        .docs-editor [data-content-type="checkListItem"] .bn-inline-content {
          font-size: 0.9375rem !important;
          color: #ffffff !important;
        }
        .docs-editor [data-content-type="bulletListItem"]::marker,
        .docs-editor [data-content-type="bulletListItem"] .bn-block-content::before,
        .docs-editor [data-content-type="bulletListItem"] li::marker,
        .docs-editor .bn-block-content[data-content-type="bulletListItem"]::before {
          color: #00a68b !important;
        }
        .docs-editor [data-content-type="numberedListItem"]::marker,
        .docs-editor [data-content-type="numberedListItem"] .bn-block-content::before,
        .docs-editor [data-content-type="numberedListItem"] li::marker,
        .docs-editor .bn-block-content[data-content-type="numberedListItem"]::before {
          color: #00a68b !important;
        }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"] {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 18px !important;
          height: 18px !important;
          border: 2px solid #334155 !important;
          border-radius: 4px !important;
          background: transparent !important;
          cursor: pointer !important;
          position: relative !important;
          transition: all 0.15s ease !important;
          flex-shrink: 0 !important;
        }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"]:hover {
          border-color: #00a68b !important;
        }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"]:checked {
          background: #00a68b !important;
          border-color: #00a68b !important;
        }
        .docs-editor [data-content-type="checkListItem"] input[type="checkbox"]:checked::after {
          content: '' !important;
          position: absolute !important;
          left: 5px !important;
          top: 1px !important;
          width: 5px !important;
          height: 10px !important;
          border: solid white !important;
          border-width: 0 2px 2px 0 !important;
          transform: rotate(45deg) !important;
        }
        .docs-editor [data-content-type="checkListItem"]:has(input:checked) .bn-inline-content {
          text-decoration: line-through !important;
          color: #64748b !important;
        }
        .docs-editor [data-content-type="checkListItem"] .bn-block-content {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        /* ── Tables ── */
        .docs-editor table {
          border-collapse: collapse !important;
        }
        .docs-editor th,
        .docs-editor td {
          border: 1px solid #334155 !important;
          padding: 0.5rem 0.75rem !important;
          font-size: 0.875rem !important;
          color: #ffffff !important;
        }
        .docs-editor th {
          background: #1e293b !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .docs-editor td {
          background: transparent !important;
        }
        .docs-editor .bn-table-handle,
        .docs-editor [class*="tableHandle"] {
          background: #334155 !important;
          border-color: #475569 !important;
        }

        /* ── Slash menu / suggestion dropdown ── */
        .docs-editor .bn-slash-menu,
        .docs-editor .bn-suggestion-menu,
        .docs-editor [class*="suggestionMenu"],
        .docs-editor [class*="slashMenu"],
        .docs-editor .mantine-Menu-dropdown,
        .docs-editor [role="menu"],
        .docs-editor [role="listbox"] {
          background: #0f172a !important;
          background-color: #0f172a !important;
          border: 1px solid #1e293b !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        }
        .docs-editor .bn-slash-menu .bn-menu-item,
        .docs-editor .bn-suggestion-menu .bn-menu-item,
        .docs-editor [class*="suggestionMenu"] [class*="item"],
        .docs-editor [role="option"],
        .docs-editor .mantine-Menu-item {
          color: #ffffff !important;
          background: transparent !important;
          border-radius: 0.375rem !important;
          padding: 0.5rem 0.75rem !important;
        }
        .docs-editor .bn-slash-menu .bn-menu-item:hover,
        .docs-editor .bn-suggestion-menu .bn-menu-item:hover,
        .docs-editor [class*="suggestionMenu"] [class*="item"]:hover,
        .docs-editor [role="option"]:hover,
        .docs-editor [role="option"][data-hovered="true"],
        .docs-editor [role="option"][aria-selected="true"],
        .docs-editor .mantine-Menu-item:hover,
        .docs-editor .mantine-Menu-item[data-hovered="true"] {
          background: #1e293b !important;
          color: #f1f5f9 !important;
        }
        .docs-editor [class*="suggestionMenu"] [class*="title"],
        .docs-editor [class*="suggestionMenu"] [class*="name"] {
          color: #ffffff !important;
          font-weight: 500 !important;
        }
        .docs-editor [class*="suggestionMenu"] [class*="subtitle"],
        .docs-editor [class*="suggestionMenu"] [class*="badge"],
        .docs-editor [class*="suggestionMenu"] [class*="description"] {
          color: #64748b !important;
        }
        .docs-editor [class*="suggestionMenu"] [class*="icon"] {
          color: #94a3b8 !important;
        }

        /* ── Formatting toolbar ── */
        .docs-editor .bn-toolbar,
        .docs-editor .bn-formatting-toolbar,
        .docs-editor [class*="formattingToolbar"],
        .docs-editor [class*="Toolbar"] {
          background: #0f172a !important;
          border: 1px solid #1e293b !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
        }
        .docs-editor .bn-toolbar button,
        .docs-editor .bn-formatting-toolbar button,
        .docs-editor [class*="formattingToolbar"] button,
        .docs-editor [class*="Toolbar"] button {
          color: #94a3b8 !important;
          background: transparent !important;
          border-radius: 0.25rem !important;
        }
        .docs-editor .bn-toolbar button:hover,
        .docs-editor .bn-formatting-toolbar button:hover,
        .docs-editor [class*="formattingToolbar"] button:hover,
        .docs-editor [class*="Toolbar"] button:hover {
          background: #1e293b !important;
          color: #f1f5f9 !important;
        }
        .docs-editor .bn-toolbar button[data-active="true"],
        .docs-editor [class*="Toolbar"] button[data-active="true"] {
          background: #1e293b !important;
          color: #2ad4ab !important;
        }
        .docs-editor [class*="Toolbar"] select,
        .docs-editor [class*="Toolbar"] input {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #ffffff !important;
          border-radius: 0.25rem !important;
        }

        /* ── Side menu (drag handle, + button) ── */
        .docs-editor .bn-side-menu,
        .docs-editor .bn-drag-handle-menu,
        .docs-editor [class*="sideMenu"] {
          background: transparent !important;
        }
        .docs-editor .bn-side-menu button,
        .docs-editor [class*="sideMenu"] button {
          color: #475569 !important;
          background: transparent !important;
        }
        .docs-editor .bn-side-menu button:hover,
        .docs-editor [class*="sideMenu"] button:hover {
          color: #94a3b8 !important;
          background: #1e293b !important;
          border-radius: 0.25rem !important;
        }

        /* ── Drag handle menu (dropdown) ── */
        .docs-editor [class*="dragHandleMenu"],
        .docs-editor .bn-drag-handle-menu [role="menu"] {
          background: #0f172a !important;
          border: 1px solid #1e293b !important;
          border-radius: 0.5rem !important;
        }

        /* ── Placeholder text ── */
        .docs-editor .bn-block-content::before,
        .docs-editor [data-placeholder]::before,
        .docs-editor .is-empty::before,
        .docs-editor .bn-inline-content::before,
        .docs-editor [class*="isEmpty"]::before,
        .docs-editor .bn-block-content[data-is-empty-and-focused]::before,
        .docs-editor .bn-inline-content[data-is-empty-and-focused]::before {
          color: #475569 !important;
          font-style: normal !important;
        }

        /* ── Image blocks ── */
        .docs-editor [data-content-type="image"] {
          border-radius: 0.5rem !important;
          overflow: hidden !important;
        }
        .docs-editor [data-content-type="image"] img {
          border-radius: 0.5rem !important;
        }

        /* ── File/link toolbar popups ── */
        .docs-editor [class*="linkToolbar"],
        .docs-editor [class*="imageToolbar"],
        .docs-editor [class*="filePanel"] {
          background: #0f172a !important;
          border: 1px solid #1e293b !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
        }
        .docs-editor [class*="linkToolbar"] input,
        .docs-editor [class*="filePanel"] input {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #ffffff !important;
          border-radius: 0.375rem !important;
        }
        .docs-editor [class*="linkToolbar"] button,
        .docs-editor [class*="filePanel"] button {
          color: #94a3b8 !important;
        }
        .docs-editor [class*="filePanel"] [class*="tab"][data-active="true"],
        .docs-editor [class*="filePanel"] [class*="tab"]:hover {
          background: #1e293b !important;
          color: #ffffff !important;
        }

        /* ── Mantine overrides (global for BlockNote) ── */
        .docs-editor .mantine-Popover-dropdown,
        .docs-editor .mantine-HoverCard-dropdown,
        .docs-editor .mantine-Tooltip-tooltip {
          background: #0f172a !important;
          border: 1px solid #1e293b !important;
          color: #ffffff !important;
        }
        .docs-editor .mantine-TextInput-input,
        .docs-editor .mantine-Select-input {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default BlockNoteWrapper;

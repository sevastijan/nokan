'use client';

import { useEffect, useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

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
        .docs-editor .bn-container,
        .docs-editor .bn-editor,
        .docs-editor .bn-block-group,
        .docs-editor .bn-block-outer,
        .docs-editor .bn-block,
        .docs-editor .bn-block-content,
        .docs-editor [class*="BlockContent"],
        .docs-editor [class*="blockContent"],
        .docs-editor .mantine-Paper-root {
          background: transparent !important;
          background-color: transparent !important;
          font-family: inherit;
        }
        .docs-editor .bn-editor {
          padding: 0 !important;
          color: #e2e8f0 !important;
        }
        .docs-editor .bn-side-menu,
        .docs-editor .bn-drag-handle-menu {
          background: #1e293b !important;
          border-color: #334155 !important;
        }
        .docs-editor .bn-toolbar,
        .docs-editor .bn-formatting-toolbar {
          background: #1e293b !important;
          border-color: #334155 !important;
        }
        .docs-editor .bn-slash-menu,
        .docs-editor .bn-suggestion-menu {
          background: #1e293b !important;
          border-color: #334155 !important;
        }
        .docs-editor [data-content-type="table"] {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default BlockNoteWrapper;

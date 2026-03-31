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
        .docs-editor .bn-container {
          background: transparent !important;
          font-family: inherit;
        }
        .docs-editor .bn-editor {
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default BlockNoteWrapper;

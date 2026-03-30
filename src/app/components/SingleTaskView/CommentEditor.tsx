'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EditorState, LexicalEditor, $getRoot, COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ImageNode } from './TaskDescription/nodes/ImageNode';
import { MentionNode } from './TaskDescription/nodes/MentionNode';
import { ToolbarPlugin } from './TaskDescription/plugins/ToolbarPlugin';
import { PasteImagePlugin } from './TaskDescription/plugins/PasteImagePlugin';
import { MentionPlugin } from './TaskDescription/plugins/MentionPlugin';
import type { User } from '@/app/types/globalTypes';

interface CommentEditorProps {
  placeholder?: string;
  teamMembers: User[];
  onSubmit: (html: string) => void;
  disabled?: boolean;
  taskId?: string;
}

const commentEditorConfig = {
  namespace: 'CommentEditor',
  theme: {
    root: 'border-none focus:outline-none text-slate-200 text-sm',
    link: 'text-brand-400 hover:text-brand-300 underline cursor-pointer',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-slate-700 px-1 py-0.5 rounded font-mono text-sm',
    },
    paragraph: 'mb-1',
    heading: {
      h1: 'text-xl font-bold mb-2 mt-3',
      h2: 'text-lg font-bold mb-2 mt-2',
      h3: 'text-base font-bold mb-1 mt-2',
    },
    list: {
      ul: 'list-disc ml-6 mb-1',
      ol: 'list-decimal ml-6 mb-1',
      listitem: 'mb-0.5',
    },
    quote: 'border-l-4 border-slate-600 pl-4 italic my-2 text-slate-300',
    code: 'bg-slate-800 p-2 rounded-lg font-mono text-sm mb-2 block overflow-x-auto',
  },
  onError: (error: Error) => {
    console.error('Comment Editor Error:', error);
  },
  nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, LinkNode, ImageNode, MentionNode],
};

/** Plugin that submits on Enter (Shift+Enter for newline) and clears editor */
function SubmitOnEnterPlugin({ onSubmit }: { onSubmit: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (event && event.shiftKey) return false;

        event?.preventDefault();

        editor.getEditorState().read(() => {
          const root = $getRoot();
          const text = root.getTextContent().trim();
          if (!text) return;

          const html = $generateHtmlFromNodes(editor);
          onSubmit(html);
        });

        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, onSubmit]);

  return null;
}

export default function CommentEditor({ placeholder, teamMembers, onSubmit, disabled, taskId }: CommentEditorProps) {
  const [uploading, setUploading] = useState(false);
  const htmlRef = useRef('');

  const handleChange = useCallback((editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      htmlRef.current = $generateHtmlFromNodes(editor);
    });
  }, []);

  const handleSubmit = useCallback((html: string) => {
    if (!html || html === '<p><br></p>') return;
    onSubmit(html);
  }, [onSubmit]);

  return (
    <div className={`w-full bg-slate-800 rounded-lg overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <LexicalComposer initialConfig={commentEditorConfig}>
        <ToolbarPlugin
          taskId={taskId}
          uploading={uploading}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
        />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none px-3 py-2 min-h-[60px] max-h-[200px] overflow-y-auto text-sm text-slate-200"
                style={{ caretColor: '#a78bfa' }}
              />
            }
            placeholder={
              <div className="absolute top-2 left-3 text-slate-500 pointer-events-none text-sm">
                {placeholder || 'Napisz komentarz...'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <SubmitOnEnterPlugin onSubmit={handleSubmit} />
          <PasteImagePlugin
            taskId={taskId}
            onUploadStart={() => setUploading(true)}
            onUploadEnd={() => setUploading(false)}
          />
          {teamMembers.length > 0 && <MentionPlugin teamMembers={teamMembers} />}
        </div>
        {uploading && <div className="p-2 text-xs text-brand-400">Wysyłanie obrazu...</div>}
      </LexicalComposer>
    </div>
  );
}

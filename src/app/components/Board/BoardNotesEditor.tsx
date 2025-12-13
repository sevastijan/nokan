'use client';

import { useEffect, useState, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $getSelection, $insertNodes, EditorState, LexicalEditor } from 'lexical';
import { FiBold, FiItalic, FiUnderline, FiCode, FiSave } from 'react-icons/fi';
import { $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';

const editorConfig = {
     namespace: 'BoardNotesEditor',
     theme: {
          root: 'p-4 border-none focus:outline-none min-h-[400px] max-h-[600px] overflow-y-auto text-slate-100',
          link: 'text-blue-400 hover:text-blue-300 underline cursor-pointer',
          text: {
               bold: 'font-bold',
               italic: 'italic',
               underline: 'underline',
               code: 'bg-slate-700 px-1 py-0.5 rounded font-mono text-sm',
          },
          paragraph: 'mb-2',
          heading: {
               h1: 'text-3xl font-bold mb-4',
               h2: 'text-2xl font-bold mb-3',
               h3: 'text-xl font-bold mb-2',
          },
          list: {
               ul: 'list-disc list-inside mb-2',
               ol: 'list-decimal list-inside mb-2',
               listitem: 'ml-4',
          },
          quote: 'border-l-4 border-slate-600 pl-4 italic my-4',
          code: 'bg-slate-800 p-4 rounded-lg font-mono text-sm mb-4 block overflow-x-auto',
     },
     onError: (error: Error) => {
          console.error('Lexical Error:', error);
     },
     nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, LinkNode],
};

interface ToolbarPluginProps {
     onSave: () => void;
     isSaving: boolean;
}

function ToolbarPlugin({ onSave, isSaving }: ToolbarPluginProps) {
     const [editor] = useLexicalComposerContext();
     const [isBold, setIsBold] = useState(false);
     const [isItalic, setIsItalic] = useState(false);
     const [isUnderline, setIsUnderline] = useState(false);

     useEffect(() => {
          return editor.registerUpdateListener(({ editorState }) => {
               editorState.read(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                         setIsBold(selection.hasFormat('bold'));
                         setIsItalic(selection.hasFormat('italic'));
                         setIsUnderline(selection.hasFormat('underline'));
                    }
               });
          });
     }, [editor]);

     const formatText = (format: 'bold' | 'italic' | 'underline' | 'code') => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
     };

     return (
          <div className="flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-800/50 flex-wrap">
               <button onClick={() => formatText('bold')} className={`p-2 rounded hover:bg-slate-700 transition ${isBold ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`} title="Bold">
                    <FiBold className="w-4 h-4" />
               </button>
               <button onClick={() => formatText('italic')} className={`p-2 rounded hover:bg-slate-700 transition ${isItalic ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`} title="Italic">
                    <FiItalic className="w-4 h-4" />
               </button>
               <button
                    onClick={() => formatText('underline')}
                    className={`p-2 rounded hover:bg-slate-700 transition ${isUnderline ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                    title="Underline"
               >
                    <FiUnderline className="w-4 h-4" />
               </button>
               <button onClick={() => formatText('code')} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Code">
                    <FiCode className="w-4 h-4" />
               </button>

               <div className="w-px h-6 bg-slate-700 mx-1" />

               <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Undo">
                    ↶
               </button>
               <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Redo">
                    ↷
               </button>

               <div className="flex-1" />

               <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded transition text-sm font-medium"
               >
                    <FiSave className="w-4 h-4" />
                    {isSaving ? 'Zapisywanie...' : 'Zapisz'}
               </button>
          </div>
     );
}

interface LoadContentPluginProps {
     initialContent: string | null;
}

function LoadContentPlugin({ initialContent }: LoadContentPluginProps) {
     const [editor] = useLexicalComposerContext();
     const [isFirstRender, setIsFirstRender] = useState(true);

     useEffect(() => {
          if (!isFirstRender || !initialContent) return;

          editor.update(() => {
               const parser = new DOMParser();
               const dom = parser.parseFromString(initialContent, 'text/html');
               const nodes = $generateNodesFromDOM(editor, dom);

               const root = $getRoot();
               root.clear();
               root.select();
               $insertNodes(nodes);
          });

          setIsFirstRender(false);
     }, [editor, initialContent, isFirstRender]);

     return null;
}

interface BoardNotesEditorProps {
     initialContent: string | null;
     onSave: (content: string) => void;
     isSaving: boolean;
}

export default function BoardNotesEditor({ initialContent, onSave, isSaving }: BoardNotesEditorProps) {
     const [editorContent, setEditorContent] = useState<string>('');

     const handleEditorChange = useCallback((editorState: EditorState, editor: LexicalEditor) => {
          editorState.read(() => {
               const htmlContent = $generateHtmlFromNodes(editor);
               setEditorContent(htmlContent);
          });
     }, []);

     const handleSave = useCallback(() => {
          onSave(editorContent);
     }, [editorContent, onSave]);

     return (
          <div className="w-full h-full flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
               <LexicalComposer initialConfig={editorConfig}>
                    <ToolbarPlugin onSave={handleSave} isSaving={isSaving} />
                    <div className="flex-1 overflow-y-auto relative bg-slate-900/50">
                         <RichTextPlugin
                              contentEditable={<ContentEditable className="outline-none p-4 min-h-[400px]" style={{ caretColor: '#60a5fa' }} />}
                              placeholder={<div className="absolute top-4 left-4 text-slate-500 pointer-events-none">Zacznij pisać swoje notatki...</div>}
                              ErrorBoundary={LexicalErrorBoundary}
                         />
                         <OnChangePlugin onChange={handleEditorChange} />
                         <HistoryPlugin />
                         <ListPlugin />
                         <LinkPlugin />
                         <LoadContentPlugin initialContent={initialContent} />
                    </div>
               </LexicalComposer>
          </div>
     );
}

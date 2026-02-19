'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import { EditorState, LexicalEditor } from 'lexical';
import { editorConfig } from './config/editorConfig';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { PasteImagePlugin } from './plugins/PasteImagePlugin';
import { LoadContentPlugin } from './plugins/LoadContentPlugin';
import { SmartEnterPlugin, SmartPastePlugin } from './plugins/SmartPlugins';
import { MentionPlugin } from './plugins/MentionPlugin';
import type { User } from '@/app/types/globalTypes';

interface TaskDescriptionProps {
     value: string;
     onChange: (value: string) => void;
     taskId?: string;
     onImageClick?: (url: string) => void;
     teamMembers?: User[];
}

export default function TaskDescription({ value, onChange, taskId, onImageClick, teamMembers = [] }: TaskDescriptionProps) {
     const [uploading, setUploading] = useState(false);
     const isFirstChangeRef = useRef(true);
     const initialValueRef = useRef(value || '');

     if (value && value !== '<p><br></p>' && !initialValueRef.current) {
          initialValueRef.current = value;
     }

     const handleEditorChange = useCallback(
          (editorState: EditorState, editor: LexicalEditor) => {
               editorState.read(() => {
                    const htmlContent = $generateHtmlFromNodes(editor);

                    if (isFirstChangeRef.current && htmlContent === initialValueRef.current) {
                         isFirstChangeRef.current = false;
                         return;
                    }

                    if (isFirstChangeRef.current && initialValueRef.current && !/<[a-z][\s\S]*>/i.test(initialValueRef.current)) {
                         isFirstChangeRef.current = false;
                         return;
                    }

                    isFirstChangeRef.current = false;

                    if (htmlContent !== value) {
                         onChange(htmlContent);
                    }
               });
          },
          [onChange, value],
     );

     useEffect(() => {
          if (!onImageClick) return;

          const handleImageClick = (e: Event) => {
               const mouseEvent = e as MouseEvent;
               const target = mouseEvent.target as HTMLElement;
               if (target.tagName === 'IMG') {
                    mouseEvent.preventDefault();
                    const src = (target as HTMLImageElement).src;
                    onImageClick(src);
               }
          };

          const handleCustomImageClick = (e: Event) => {
               const customEvent = e as CustomEvent;
               if (customEvent.detail?.src) {
                    onImageClick(customEvent.detail.src);
               }
          };

          const root = document.querySelector('[data-lexical-editor]');
          if (root) {
               root.addEventListener('click', handleImageClick);
               root.addEventListener('lexical-image-click', handleCustomImageClick);
               return () => {
                    root.removeEventListener('click', handleImageClick);
                    root.removeEventListener('lexical-image-click', handleCustomImageClick);
               };
          }
     }, [onImageClick]);

     return (
          <div>
               <span className="block text-sm font-medium text-slate-300 mb-2">Opis</span>
               <div className="w-full bg-slate-700 border border-slate-600 rounded overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                    <LexicalComposer key={taskId || 'new'} initialConfig={editorConfig}>
                         <ToolbarPlugin taskId={taskId} uploading={uploading} onUploadStart={() => setUploading(true)} onUploadEnd={() => setUploading(false)} />
                         <div className="relative bg-slate-700/50">
                              <RichTextPlugin
                                   contentEditable={<ContentEditable className="outline-none p-3 min-h-30" style={{ caretColor: '#a78bfa' }} data-lexical-editor />}
                                   placeholder={
                                        <div className="absolute top-3 left-3 text-slate-400 pointer-events-none text-sm">Opisz zadanie...</div>
                                   }
                                   ErrorBoundary={LexicalErrorBoundary}
                              />
                              <OnChangePlugin onChange={handleEditorChange} />
                              <HistoryPlugin />
                              <ListPlugin />
                              <LinkPlugin />
                              <LoadContentPlugin initialContent={initialValueRef.current} />
                              <SmartEnterPlugin />
                              <SmartPastePlugin />
                              <PasteImagePlugin taskId={taskId} onUploadStart={() => setUploading(true)} onUploadEnd={() => setUploading(false)} />
                              {teamMembers.length > 0 && <MentionPlugin teamMembers={teamMembers} />}
                         </div>
                         {uploading && <div className="p-2 bg-slate-800/50 border-t border-slate-700 text-xs text-purple-400">Wysyłanie obrazu...</div>}
                    </LexicalComposer>
               </div>
          </div>
     );
}

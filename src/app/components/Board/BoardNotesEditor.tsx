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
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $getSelection, $insertNodes, EditorState, LexicalEditor, $createParagraphNode, TextNode } from 'lexical';
import { FiBold, FiItalic, FiUnderline, FiCode, FiSave, FiList, FiAlignLeft, FiAlignCenter, FiAlignRight, FiLink } from 'react-icons/fi';
import { $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, $isListNode } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $isLinkNode } from '@lexical/link';

const editorConfig = {
     namespace: 'BoardNotesEditor',
     theme: {
          root: 'border-none focus:outline-none text-slate-100',
          link: 'text-blue-400 hover:text-blue-300 underline cursor-pointer',
          text: {
               bold: 'font-bold',
               italic: 'italic',
               underline: 'underline',
               strikethrough: 'line-through',
               code: 'bg-slate-700 px-1 py-0.5 rounded font-mono text-sm',
          },
          paragraph: 'mb-2',
          heading: {
               h1: 'text-3xl font-bold mb-4 mt-6',
               h2: 'text-2xl font-bold mb-3 mt-5',
               h3: 'text-xl font-bold mb-2 mt-4',
          },
          list: {
               ul: 'list-disc ml-6 mb-2',
               ol: 'list-decimal ml-6 mb-2',
               listitem: 'mb-1',
               nested: {
                    listitem: 'list-none',
               },
          },
          quote: 'border-l-4 border-slate-600 pl-4 italic my-4 text-slate-300',
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
     const [isStrikethrough, setIsStrikethrough] = useState(false);
     const [isCode, setIsCode] = useState(false);
     const [blockType, setBlockType] = useState('paragraph');
     const [fontSize, setFontSize] = useState('16px');
     const [isLink, setIsLink] = useState(false);
     const [showLinkInput, setShowLinkInput] = useState(false);
     const [linkUrl, setLinkUrl] = useState('');

     useEffect(() => {
          return editor.registerUpdateListener(({ editorState }) => {
               editorState.read(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                         setIsBold(selection.hasFormat('bold'));
                         setIsItalic(selection.hasFormat('italic'));
                         setIsUnderline(selection.hasFormat('underline'));
                         setIsStrikethrough(selection.hasFormat('strikethrough'));
                         setIsCode(selection.hasFormat('code'));

                         // Check if selection is in a link
                         const node = selection.anchor.getNode();
                         const parent = node.getParent();
                         setIsLink($isLinkNode(parent) || $isLinkNode(node));

                         const anchorNode = selection.anchor.getNode();
                         const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

                         const elementKey = element.getKey();
                         const elementDOM = editor.getElementByKey(elementKey);

                         if (elementDOM !== null) {
                              if ($isListNode(element)) {
                                   const parentList = element;
                                   const type = parentList.getListType();
                                   setBlockType(type);
                              } else {
                                   const type = $isHeadingNode(element) ? element.getTag() : element.getType();
                                   setBlockType(type);
                              }
                         }
                    }
               });
          });
     }, [editor]);

     const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
     };

     const formatParagraph = () => {
          editor.update(() => {
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
               }
          });
     };

     const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
          editor.update(() => {
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(headingSize));
               }
          });
     };

     const formatQuote = () => {
          editor.update(() => {
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createQuoteNode());
               }
          });
     };

     const formatBulletList = () => {
          if (blockType !== 'bullet') {
               editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
               editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
     };

     const formatNumberedList = () => {
          if (blockType !== 'number') {
               editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
               editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
     };

     const formatAlign = (alignment: 'left' | 'center' | 'right') => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
     };

     const handleFontSizeChange = (newSize: string) => {
          setFontSize(newSize);
          editor.update(() => {
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                    const nodes = selection.getNodes();
                    nodes.forEach((node) => {
                         if (node instanceof TextNode) {
                              // Get the parent element to apply style
                              const parentElement = node.getParent();
                              if (parentElement) {
                                   const key = node.getKey();
                                   const domElement = editor.getElementByKey(key);
                                   if (domElement && domElement instanceof HTMLElement) {
                                        // Apply font size directly to DOM element
                                        domElement.style.fontSize = newSize;
                                   }
                              }
                         }
                    });
               }
          });
     };

     const insertLink = () => {
          if (!isLink) {
               setShowLinkInput(true);
          } else {
               editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          }
     };

     const confirmLink = () => {
          if (linkUrl.trim()) {
               editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
               setLinkUrl('');
               setShowLinkInput(false);
          }
     };

     return (
          <div className="border-b border-slate-700 bg-slate-800/50">
               {/* First row - Text formatting */}
               <div className="flex items-center gap-1 p-2 flex-wrap border-b border-slate-700/50">
                    {/* Block type dropdown */}
                    <select
                         value={blockType}
                         onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'paragraph') formatParagraph();
                              else if (value === 'h1' || value === 'h2' || value === 'h3') formatHeading(value);
                              else if (value === 'quote') formatQuote();
                         }}
                         className="px-3 py-1.5 bg-slate-700 text-slate-200 text-sm rounded hover:bg-slate-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                         <option value="paragraph">Normal</option>
                         <option value="h1">Heading 1</option>
                         <option value="h2">Heading 2</option>
                         <option value="h3">Heading 3</option>
                         <option value="quote">Quote</option>
                    </select>

                    {/* Font size selector */}
                    <select
                         value={fontSize}
                         onChange={(e) => handleFontSizeChange(e.target.value)}
                         className="px-3 py-1.5 bg-slate-700 text-slate-200 text-sm rounded hover:bg-slate-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                         title="Font Size"
                    >
                         <option value="12px">12px</option>
                         <option value="14px">14px</option>
                         <option value="16px">16px</option>
                         <option value="18px">18px</option>
                         <option value="20px">20px</option>
                         <option value="24px">24px</option>
                         <option value="28px">28px</option>
                         <option value="32px">32px</option>
                         <option value="36px">36px</option>
                         <option value="48px">48px</option>
                    </select>

                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    {/* Text formatting */}
                    <button
                         onClick={() => formatText('bold')}
                         className={`p-2 rounded hover:bg-slate-700 transition ${isBold ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title="Bold (Ctrl+B)"
                    >
                         <FiBold className="w-4 h-4" />
                    </button>
                    <button
                         onClick={() => formatText('italic')}
                         className={`p-2 rounded hover:bg-slate-700 transition ${isItalic ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title="Italic (Ctrl+I)"
                    >
                         <FiItalic className="w-4 h-4" />
                    </button>
                    <button
                         onClick={() => formatText('underline')}
                         className={`p-2 rounded hover:bg-slate-700 transition ${isUnderline ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title="Underline (Ctrl+U)"
                    >
                         <FiUnderline className="w-4 h-4" />
                    </button>
                    <button
                         onClick={() => formatText('strikethrough')}
                         className={`p-2 rounded hover:bg-slate-700 transition ${isStrikethrough ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title="Strikethrough"
                    >
                         <span className="text-lg font-bold">S</span>
                    </button>
                    <button onClick={() => formatText('code')} className={`p-2 rounded hover:bg-slate-700 transition ${isCode ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`} title="Code">
                         <FiCode className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    {/* Link */}
                    <button
                         onClick={insertLink}
                         className={`p-2 rounded hover:bg-slate-700 transition ${isLink ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title={isLink ? 'Remove Link' : 'Insert Link'}
                    >
                         <FiLink className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    {/* Lists */}
                    <button
                         onClick={formatBulletList}
                         className={`p-2 rounded hover:bg-slate-700 transition ${blockType === 'bullet' ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title="Bullet List"
                    >
                         <FiList className="w-4 h-4" />
                    </button>
                    <button
                         onClick={formatNumberedList}
                         className={`p-2 rounded hover:bg-slate-700 transition ${blockType === 'number' ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
                         title="Numbered List"
                    >
                         <span className="text-sm font-bold">1.</span>
                    </button>

                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    {/* Alignment */}
                    <button onClick={() => formatAlign('left')} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Align Left">
                         <FiAlignLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => formatAlign('center')} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Align Center">
                         <FiAlignCenter className="w-4 h-4" />
                    </button>
                    <button onClick={() => formatAlign('right')} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Align Right">
                         <FiAlignRight className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-slate-700 mx-1" />

                    {/* Undo/Redo */}
                    <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Undo (Ctrl+Z)">
                         ↶
                    </button>
                    <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="p-2 rounded hover:bg-slate-700 transition text-slate-300" title="Redo (Ctrl+Y)">
                         ↷
                    </button>

                    <div className="flex-1" />

                    {/* Save button */}
                    <button
                         onClick={onSave}
                         disabled={isSaving}
                         className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded transition text-sm font-medium"
                    >
                         <FiSave className="w-4 h-4" />
                         {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
               </div>

               {/* Link input row */}
               {showLinkInput && (
                    <div className="flex items-center gap-2 p-2 bg-slate-700/50">
                         <input
                              type="url"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                        confirmLink();
                                   } else if (e.key === 'Escape') {
                                        setShowLinkInput(false);
                                        setLinkUrl('');
                                   }
                              }}
                              placeholder="https://example.com"
                              className="flex-1 px-3 py-1.5 bg-slate-700 text-slate-200 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                         />
                         <button onClick={confirmLink} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition">
                              OK
                         </button>
                         <button
                              onClick={() => {
                                   setShowLinkInput(false);
                                   setLinkUrl('');
                              }}
                              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition"
                         >
                              Anuluj
                         </button>
                    </div>
               )}
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
                              contentEditable={<ContentEditable className="outline-none p-4 min-h-full" style={{ caretColor: '#60a5fa' }} />}
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

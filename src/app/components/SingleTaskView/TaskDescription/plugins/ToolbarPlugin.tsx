import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $createParagraphNode, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { FiBold, FiItalic, FiUnderline, FiCode, FiList, FiLink, FiImage } from 'react-icons/fi';
import { toast } from 'sonner';
import { uploadImage, insertImageIntoEditor } from '../utils/imageUpload';

interface ToolbarPluginProps {
     taskId?: string;
     uploading: boolean;
     onUploadStart: () => void;
     onUploadEnd: () => void;
}

export function ToolbarPlugin({ taskId, uploading, onUploadStart, onUploadEnd }: ToolbarPluginProps) {
     const [editor] = useLexicalComposerContext();
     const [isBold, setIsBold] = useState(false);
     const [isItalic, setIsItalic] = useState(false);
     const [isUnderline, setIsUnderline] = useState(false);
     const [isCode, setIsCode] = useState(false);
     const [blockType, setBlockType] = useState('paragraph');
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
                         setIsCode(selection.hasFormat('code'));

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

     const formatText = (format: 'bold' | 'italic' | 'underline' | 'code') => {
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

     const insertLink = () => {
          if (!isLink) {
               setShowLinkInput(true);
          } else {
               editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          }
     };

     const confirmLink = () => {
          if (linkUrl.trim()) {
               let url = linkUrl.trim();
               if (!url.match(/^https?:\/\//i)) {
                    url = 'https://' + url;
               }
               editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
               setLinkUrl('');
               setShowLinkInput(false);
          }
     };

     const handleImageUpload = async (file: File) => {
          onUploadStart();

          try {
               const result = await uploadImage(file, taskId);

               if (!result.success) {
                    toast.error(result.error || 'Nie udało się dodać obrazu');
                    return;
               }

               if (result.imageUrl) {
                    insertImageIntoEditor(editor, result.imageUrl, file.name);
                    toast.success('Obraz dodany');
               }
          } catch (error) {
               console.error('Błąd uploadu obrazu:', error);
               toast.error('Nie udało się dodać obrazu');
          } finally {
               onUploadEnd();
          }
     };

     const triggerImageUpload = () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
               const file = (e.target as HTMLInputElement).files?.[0];
               if (file) handleImageUpload(file);
          };
          input.click();
     };

     return (
          <div className="border-b border-slate-700 bg-slate-800/50">
               <div className="flex items-center gap-1 p-2 flex-wrap">
                    <select
                         value={blockType}
                         onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'paragraph') formatParagraph();
                              else if (value === 'h1' || value === 'h2' || value === 'h3') formatHeading(value as 'h1' | 'h2' | 'h3');
                              else if (value === 'quote') formatQuote();
                         }}
                         className="px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded hover:bg-slate-600 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                         <option value="paragraph">Normal</option>
                         <option value="h1">Heading 1</option>
                         <option value="h2">Heading 2</option>
                         <option value="h3">Heading 3</option>
                         <option value="quote">Quote</option>
                    </select>

                    <div className="w-px h-5 bg-slate-700 mx-1" />

                    <button onClick={() => formatText('bold')} className={`p-1.5 rounded hover:bg-slate-700 transition ${isBold ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`} title="Bold">
                         <FiBold className="w-3.5 h-3.5" />
                    </button>
                    <button
                         onClick={() => formatText('italic')}
                         className={`p-1.5 rounded hover:bg-slate-700 transition ${isItalic ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`}
                         title="Italic"
                    >
                         <FiItalic className="w-3.5 h-3.5" />
                    </button>
                    <button
                         onClick={() => formatText('underline')}
                         className={`p-1.5 rounded hover:bg-slate-700 transition ${isUnderline ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`}
                         title="Underline"
                    >
                         <FiUnderline className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => formatText('code')} className={`p-1.5 rounded hover:bg-slate-700 transition ${isCode ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`} title="Code">
                         <FiCode className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-5 bg-slate-700 mx-1" />

                    <button
                         onClick={insertLink}
                         className={`p-1.5 rounded hover:bg-slate-700 transition ${isLink ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`}
                         title={isLink ? 'Remove Link' : 'Insert Link'}
                    >
                         <FiLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                         onClick={triggerImageUpload}
                         disabled={uploading}
                         className={`p-1.5 rounded hover:bg-slate-700 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''} text-slate-300`}
                         title="Insert Image"
                    >
                         <FiImage className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-5 bg-slate-700 mx-1" />

                    <button
                         onClick={formatBulletList}
                         className={`p-1.5 rounded hover:bg-slate-700 transition ${blockType === 'bullet' ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`}
                         title="Bullet List"
                    >
                         <FiList className="w-3.5 h-3.5" />
                    </button>
                    <button
                         onClick={formatNumberedList}
                         className={`p-1.5 rounded hover:bg-slate-700 transition ${blockType === 'number' ? 'bg-slate-700 text-purple-400' : 'text-slate-300'}`}
                         title="Numbered List"
                    >
                         <span className="text-xs font-bold">1.</span>
                    </button>

                    <div className="w-px h-5 bg-slate-700 mx-1" />

                    <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="p-1.5 rounded hover:bg-slate-700 transition text-slate-300 text-sm" title="Undo">
                         ↶
                    </button>
                    <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="p-1.5 rounded hover:bg-slate-700 transition text-slate-300 text-sm" title="Redo">
                         ↷
                    </button>
               </div>

               {showLinkInput && (
                    <div className="flex items-center gap-2 p-2 bg-slate-700/50 border-t border-slate-700">
                         <input
                              type="text"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                        e.preventDefault();
                                        confirmLink();
                                   } else if (e.key === 'Escape') {
                                        setShowLinkInput(false);
                                        setLinkUrl('');
                                   }
                              }}
                              placeholder="example.com lub https://example.com"
                              className="flex-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              autoFocus
                         />
                         <button onClick={confirmLink} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition">
                              OK
                         </button>
                         <button
                              onClick={() => {
                                   setShowLinkInput(false);
                                   setLinkUrl('');
                              }}
                              className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition"
                         >
                              Anuluj
                         </button>
                    </div>
               )}
          </div>
     );
}

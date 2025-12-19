import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $createParagraphNode, KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';

// Better Enter Key Management Plugin
export function SmartEnterPlugin() {
     const [editor] = useLexicalComposerContext();

     useEffect(() => {
          return editor.registerCommand(
               KEY_ENTER_COMMAND,
               (event: KeyboardEvent | null) => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return false;

                    const anchorNode = selection.anchor.getNode();

                    // Check if we're in an empty paragraph
                    if (anchorNode.getTextContent().trim() === '') {
                         const parent = anchorNode.getParent();

                         // If it's a heading or quote, convert to paragraph on Enter
                         if ($isHeadingNode(parent) || parent?.getType() === 'quote') {
                              event?.preventDefault();
                              editor.update(() => {
                                   if ($isRangeSelection(selection)) {
                                        $setBlocksType(selection, () => $createParagraphNode());
                                   }
                              });
                              return true;
                         }
                    }

                    return false;
               },
               COMMAND_PRIORITY_HIGH,
          );
     }, [editor]);

     return null;
}

// Smart Paste Plugin - preserves formatting intelligently
export function SmartPastePlugin() {
     const [editor] = useLexicalComposerContext();

     useEffect(() => {
          const handlePaste = (event: ClipboardEvent) => {
               const clipboardData = event.clipboardData;
               if (!clipboardData) return;

               const htmlData = clipboardData.getData('text/html');
               const textData = clipboardData.getData('text/plain');

               // If pasting from external source with HTML, let Lexical handle it naturally
               if (htmlData && !textData.includes('```')) {
                    return;
               }

               // If pasting plain text with URLs, just insert as-is for now
               // (URL auto-linking would require more complex logic)
               if (textData && !htmlData) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    if (urlRegex.test(textData)) {
                         // Let default paste behavior handle it
                         return;
                    }
               }
          };

          const rootElement = editor.getRootElement();
          if (rootElement) {
               rootElement.addEventListener('paste', handlePaste);
               return () => rootElement.removeEventListener('paste', handlePaste);
          }
     }, [editor]);

     return null;
}

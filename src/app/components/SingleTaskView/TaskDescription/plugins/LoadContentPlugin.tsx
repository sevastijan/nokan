import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $createParagraphNode } from 'lexical';

interface LoadContentPluginProps {
     initialContent: string;
}

export function LoadContentPlugin({ initialContent }: LoadContentPluginProps) {
     const [editor] = useLexicalComposerContext();
     const loadedContentRef = useRef<string>('');
     const isLoadingRef = useRef(false);

     useEffect(() => {
          if (!initialContent || initialContent === '<p><br></p>' || loadedContentRef.current === initialContent || isLoadingRef.current) {
               return;
          }

          console.log('🟢 LoadContentPlugin - WILL LOAD content');
          isLoadingRef.current = true;

          const loadContent = () => {
               editor.update(() => {
                    try {
                         // Check if content is HTML or plain text
                         const isHTML = /<[a-z][\s\S]*>/i.test(initialContent);
                         let contentToLoad = initialContent;

                         if (!isHTML) {
                              // Convert plain text to HTML paragraphs
                              const lines = initialContent.split('\n').filter((line) => line.trim());
                              contentToLoad = lines.map((line) => `<p>${line}</p>`).join('');

                              if (!contentToLoad) {
                                   contentToLoad = `<p>${initialContent}</p>`;
                              }
                         }

                         const parser = new DOMParser();
                         const dom = parser.parseFromString(contentToLoad, 'text/html');

                         const nodes = $generateNodesFromDOM(editor, dom);

                         const root = $getRoot();
                         root.clear();

                         const validNodes = nodes.filter((node) => {
                              const type = node.getType();
                              return type !== 'text' && type !== 'linebreak';
                         });

                         if (validNodes.length > 0) {
                              root.append(...validNodes);
                         } else {
                              const paragraph = $createParagraphNode();
                              root.append(paragraph);
                         }

                         loadedContentRef.current = initialContent;
                         isLoadingRef.current = false;
                    } catch (error) {
                         console.error('❌ Error loading content:', error);
                         isLoadingRef.current = false;
                    }
               });
          };

          const timeout = setTimeout(loadContent, 50);

          return () => {
               clearTimeout(timeout);
          };
     }, [editor, initialContent]);

     return null;
}

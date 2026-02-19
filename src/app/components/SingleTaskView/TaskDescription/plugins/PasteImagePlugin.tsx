import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { toast } from 'sonner';
import { uploadImage, insertImageIntoEditor } from '../utils/imageUpload';

interface PasteImagePluginProps {
     taskId?: string;
     onUploadStart: () => void;
     onUploadEnd: () => void;
}

export function PasteImagePlugin({ taskId, onUploadStart, onUploadEnd }: PasteImagePluginProps) {
     const [editor] = useLexicalComposerContext();

     useEffect(() => {
          const handlePaste = async (event: ClipboardEvent) => {
               const items = event.clipboardData?.items;
               if (!items) return;

               let processedImage = false;

               for (const item of Array.from(items)) {
                    if (item.type.includes('image')) {
                         processedImage = true;
                         event.preventDefault();
                         const file = item.getAsFile();
                         if (!file) continue;

                         onUploadStart();

                         try {
                              const result = await uploadImage(file, taskId);

                              if (!result.success) {
                                   toast.error(result.error || 'Nie udało się wkleić obrazu');
                                   continue;
                              }

                              if (result.imageUrl) {
                                   insertImageIntoEditor(editor, result.imageUrl, file.name);
                                   toast.success('Obraz wklejony');
                              }
                         } catch (error) {
                              console.error('Błąd wklejania obrazu:', error);
                              toast.error('Nie udało się wkleić obrazu');
                         } finally {
                              onUploadEnd();
                         }
                    }
               }

               if (processedImage) {
                    event.preventDefault();
               }
          };

          const contentEditable = editor.getRootElement();
          if (contentEditable) {
               contentEditable.addEventListener('paste', handlePaste as unknown as EventListener);
               return () => contentEditable.removeEventListener('paste', handlePaste as unknown as EventListener);
          }
     }, [editor, taskId, onUploadStart, onUploadEnd]);

     return null;
}

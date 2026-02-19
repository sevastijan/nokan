import { LexicalEditor } from 'lexical';
import { $getSelection, $isRangeSelection } from 'lexical';
import { $createImageNode } from '../nodes/ImageNode';

export interface ImageUploadResult {
     success: boolean;
     imageUrl?: string;
     error?: string;
}

export const uploadImage = async (file: File, taskId?: string): Promise<ImageUploadResult> => {
     if (file.size > 10 * 1024 * 1024) {
          return { success: false, error: 'Obraz za duży (max 10MB)' };
     }

     try {
          const formData = new FormData();
          formData.append('file', file);
          if (taskId) {
               formData.append('taskId', taskId);
          }

          const response = await fetch('/api/upload-task-image', {
               method: 'POST',
               body: formData,
          });

          if (!response.ok) {
               let errorMessage = 'Upload failed';
               try {
                    const err = await response.json();
                    errorMessage = err.error || errorMessage;
               } catch {}
               return { success: false, error: errorMessage };
          }

          const result = await response.json();
          const { image } = result;

          if (!image?.signed_url) {
               return { success: false, error: 'Nie udało się uzyskać URL obrazu' };
          }

          return { success: true, imageUrl: image.signed_url };
     } catch (error) {
          console.error('Błąd uploadu obrazu:', error);
          return { success: false, error: 'Nie udało się dodać obrazu' };
     }
};

export const insertImageIntoEditor = (editor: LexicalEditor, imageUrl: string, altText: string) => {
     editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
               const imageNode = $createImageNode(imageUrl, altText);
               selection.insertNodes([imageNode]);
          }
     });
};

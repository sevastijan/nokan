import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Attachment } from '@/app/types/globalTypes';

interface LocalFilePreview {
     id: string;
     file: File;
     previewUrl: string;
}

interface UploadAttachmentParams {
     file: File;
     taskId: string;
}

interface UploadMutation {
     (params: UploadAttachmentParams): {
          unwrap: () => Promise<Attachment>;
     };
}

interface UseAttachmentUploadProps {
     uploadAttachmentMutation: UploadMutation;
     onTaskUpdate: () => Promise<void>;
}

export const useAttachmentUpload = ({ uploadAttachmentMutation, onTaskUpdate }: UseAttachmentUploadProps) => {
     const [localFilePreviews, setLocalFilePreviews] = useState<LocalFilePreview[]>([]);

     const addFiles = useCallback((files: File[]) => {
          const validFiles: File[] = [];
          let hasInvalidFiles = false;

          files.forEach((file) => {
               if (file.size > 10 * 1024 * 1024) {
                    toast.error(`Plik ${file.name} jest za duży (max 10MB)`);
                    hasInvalidFiles = true;
               } else {
                    validFiles.push(file);
               }
          });

          if (validFiles.length > 0) {
               const previews = validFiles.map((file) => ({
                    id: crypto.randomUUID(),
                    file,
                    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
               }));

               setLocalFilePreviews((prev) => [...prev, ...previews]);

               if (!hasInvalidFiles) {
                    toast.success(`Dodano ${validFiles.length} ${validFiles.length === 1 ? 'plik' : 'plików'}`);
               }
          }
     }, []);

     const removeFile = useCallback((id: string) => {
          setLocalFilePreviews((prev) => {
               const removed = prev.find((f) => f.id === id);
               if (removed?.previewUrl) {
                    URL.revokeObjectURL(removed.previewUrl);
               }
               return prev.filter((f) => f.id !== id);
          });
          toast.success('Plik usunięty');
     }, []);

     const uploadAllAttachments = useCallback(
          async (files: LocalFilePreview[], taskId: string): Promise<{ success: boolean; errors: number }> => {
               if (files.length === 0) return { success: true, errors: 0 };

               toast.info('Przesyłanie załączników...');
               let errors = 0;

               for (const { file, previewUrl } of files) {
                    try {
                         await uploadAttachmentMutation({ file, taskId }).unwrap();
                         if (previewUrl) URL.revokeObjectURL(previewUrl);
                    } catch (error) {
                         console.error('Upload failed:', error);
                         errors++;
                    }
               }

               setLocalFilePreviews([]);
               await onTaskUpdate();

               return { success: errors === 0, errors };
          },
          [uploadAttachmentMutation, onTaskUpdate],
     );

     const cleanupPreviews = useCallback(() => {
          localFilePreviews.forEach(({ previewUrl }) => {
               if (previewUrl) URL.revokeObjectURL(previewUrl);
          });
     }, [localFilePreviews]);

     return {
          localFilePreviews,
          addFiles,
          removeFile,
          uploadAllAttachments,
          cleanupPreviews,
     };
};

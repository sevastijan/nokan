import { toast } from 'sonner';

export function useAttachmentUpload(uploadAttachment: (file: File) => Promise<unknown | null>) {
     const uploadFiles = async (files: File[]) => {
          for (const file of files) {
               try {
                    const res = await uploadAttachment(file);
                    if (!res) {
                         toast.error(`Failed to upload ${file.name}`);
                    }
               } catch (err) {
                    console.error('Attachment upload error:', err);
                    toast.error(`Error uploading ${file.name}`);
               }
          }
     };

     return { uploadFiles };
}

// src/app/components/SingleTaskView/hooks/useAttachmentUpload.ts
import { toast } from "react-toastify";

// uploadAttachment: function that takes a File and returns Promise<Attachment | null>
export function useAttachmentUpload(
  uploadAttachment: (file: File) => Promise<any | null>
) {
  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        const res = await uploadAttachment(file);
        if (!res) {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error("Attachment upload error:", err);
        toast.error(`Error uploading ${file.name}`);
      }
    }
  };

  return { uploadFiles };
}

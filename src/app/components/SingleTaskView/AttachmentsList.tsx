import { FaDownload, FaTrash, FaEye } from 'react-icons/fa';
import { Attachment } from '@/app/types/globalTypes';
import { formatFileSize, getFileIcon } from '@/app/utils/helpers';
import { toast } from 'sonner';

interface AttachmentsListProps {
     attachments: Attachment[];
     taskId: string;
     onTaskUpdate?: () => Promise<void>;
     onAttachmentsUpdate?: () => Promise<void>;
     onPreviewImage?: (attachment: Attachment) => void;
     currentUser: {
          id: string;
          name?: string | null;
          email: string;
     };
     onUploadAttachment?: (file: File) => Promise<Attachment | null>;
}

const AttachmentsList = ({ attachments, onTaskUpdate, onAttachmentsUpdate, onPreviewImage }: AttachmentsListProps) => {
     const handleDownload = async (attachment: Attachment) => {
          try {
               const response = await fetch(`/api/upload?filePath=${encodeURIComponent(attachment.file_path)}&action=download`);

               if (!response.ok) {
                    throw new Error('Download failed');
               }

               const blob = await response.blob();
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = attachment.file_name;
               document.body.appendChild(a);
               a.click();
               document.body.removeChild(a);
               URL.revokeObjectURL(url);
          } catch (error) {
               console.error('Error downloading file:', error);
               toast.error('Błąd podczas pobierania pliku');
          }
     };

     const handleDelete = async (attachment: Attachment) => {
          if (!confirm('Czy na pewno chcesz usunąć ten załącznik?')) return;

          try {
               const response = await fetch('/api/upload', {
                    method: 'DELETE',
                    headers: {
                         'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                         attachmentId: attachment.id,
                         filePath: attachment.file_path,
                    }),
               });

               if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Delete failed');
               }

               await onAttachmentsUpdate?.();
               await onTaskUpdate?.();

               toast.success('Załącznik usunięty');
          } catch (error) {
               console.error('Error deleting attachment:', error);
               toast.error(error instanceof Error ? error.message : 'Błąd podczas usuwania załącznika');
          }
     };

     const handlePreview = (attachment: Attachment) => {
          if (attachment.mime_type.startsWith('image/')) {
               onPreviewImage?.(attachment);
          } else {
               handleDownload(attachment);
          }
     };

     return (
          <>
               {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3">
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-2xl flex items-center justify-center w-8 h-8">{getFileIcon(attachment.mime_type)}</span>
                              <div className="flex-1 min-w-0">
                                   <p className="text-sm font-medium text-slate-200 truncate">{attachment.file_name}</p>
                                   <p className="text-xs text-slate-400">{formatFileSize(attachment.file_size)}</p>
                              </div>
                         </div>
                         <div className="flex items-center gap-1">
                              <button
                                   onClick={() => handlePreview(attachment)}
                                   className="p-2 text-slate-300 hover:text-white hover:bg-slate-600/50 rounded transition-colors"
                                   title={attachment.mime_type.startsWith('image/') ? 'Podgląd' : 'Pobierz'}
                              >
                                   <FaEye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDownload(attachment)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-600/50 rounded transition-colors" title="Pobierz">
                                   <FaDownload className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(attachment)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors" title="Usuń">
                                   <FaTrash className="w-4 h-4" />
                              </button>
                         </div>
                    </div>
               ))}
          </>
     );
};

export default AttachmentsList;

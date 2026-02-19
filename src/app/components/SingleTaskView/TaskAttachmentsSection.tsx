'use client';

import { ChangeEvent, useRef, useState, useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import AttachmentsList from './AttachmentsList';
import { formatFileSize, getFileIcon } from '@/app/utils/helpers';
import { Attachment } from '@/app/types/globalTypes';
import { toast } from 'sonner';
import Lightbox, { LightboxImage } from '@/app/components/Lightbox/Lightbox';

interface LocalFilePreview {
     id: string;
     file: File;
     previewUrl: string;
     uploading?: boolean;
}

interface TaskAttachmentsSectionProps {
     isNewTask: boolean;
     taskId?: string;
     attachments?: Attachment[];
     localFilePreviews: LocalFilePreview[];
     onAddFiles: (files: File[]) => void;
     onRemoveLocalFile: (id: string) => void;
     currentUser: {
          id: string;
          name?: string | null;
          email: string;
     };
     onTaskUpdate: () => Promise<void>;
     onAttachmentsUpdate: () => Promise<void>;
     onUploadAttachment: (file: File) => Promise<Attachment | null>;
}

const TaskAttachmentsSection = ({
     isNewTask,
     taskId,
     attachments = [],
     localFilePreviews,
     onAddFiles,
     onRemoveLocalFile,
     currentUser,
     onTaskUpdate,
     onAttachmentsUpdate,
     onUploadAttachment,
}: TaskAttachmentsSectionProps) => {
     const { t } = useTranslation();
     const fileInputRef = useRef<HTMLInputElement>(null);
     const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
     const [lightboxOpen, setLightboxOpen] = useState(false);
     const [currentImageIndex, setCurrentImageIndex] = useState(0);

     const allLightboxImages = useMemo(() => {
          const images: LightboxImage[] = [];

          localFilePreviews.forEach((lp) => {
               if (lp.file.type.startsWith('image/')) {
                    images.push({
                         src: lp.previewUrl,
                         alt: lp.file.name,
                         title: lp.file.name,
                    });
               }
          });

          attachments.forEach((att) => {
               if (att.mime_type.startsWith('image/')) {
                    images.push({
                         src: `/api/upload?filePath=${encodeURIComponent(att.file_path)}&action=preview`,
                         alt: att.file_name,
                         title: att.file_name,
                         downloadUrl: `/api/upload?filePath=${encodeURIComponent(att.file_path)}&action=download`,
                    });
               }
          });

          return images;
     }, [localFilePreviews, attachments]);

     const handleFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;

          const newFiles = Array.from(files);

          if (!isNewTask && taskId) {
               for (const file of newFiles) {
                    if (file.size > 10 * 1024 * 1024) {
                         toast.error(t('attachments.fileTooLarge', { name: file.name }));
                         continue;
                    }

                    const tempId = crypto.randomUUID();
                    setUploadingFiles((prev) => new Set(prev).add(tempId));

                    try {
                         const attachment = await onUploadAttachment(file);
                         if (attachment) {
                              toast.success(t('attachments.uploaded', { name: file.name }));
                              await onAttachmentsUpdate();
                         } else {
                              toast.error(t('attachments.uploadFailed', { name: file.name }));
                         }
                    } catch (error) {
                         console.error('Upload failed:', error);
                         toast.error(t('attachments.uploadError', { name: file.name }));
                    } finally {
                         setUploadingFiles((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(tempId);
                              return newSet;
                         });
                    }
               }
          } else {
               onAddFiles(newFiles);
          }

          if (fileInputRef.current) {
               fileInputRef.current.value = '';
          }
     };

     const handleLocalPreviewClick = (localPreview: LocalFilePreview) => {
          if (localPreview.file.type.startsWith('image/')) {
               const imageIndex = allLightboxImages.findIndex((img) => img.src === localPreview.previewUrl);
               if (imageIndex !== -1) {
                    setCurrentImageIndex(imageIndex);
                    setLightboxOpen(true);
               }
          } else {
               window.open(localPreview.previewUrl, '_blank');
          }
     };

     const handleAttachmentPreview = (attachment: Attachment) => {
          const attachmentUrl = `/api/upload?filePath=${encodeURIComponent(attachment.file_path)}&action=preview`;
          const imageIndex = allLightboxImages.findIndex((img) => img.src === attachmentUrl);

          if (imageIndex !== -1) {
               setCurrentImageIndex(imageIndex);
               setLightboxOpen(true);
          }
     };

     const totalAttachments = attachments.length + localFilePreviews.length + uploadingFiles.size;

     return (
          <div className="mt-6">
               <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFilesChange} accept="*/*" />

               <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                   />
                              </svg>
                              {t('attachments.title', { count: totalAttachments })}
                         </h3>
                         <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingFiles.size > 0}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                         >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {uploadingFiles.size > 0 ? t('attachments.uploading') : t('attachments.addFile')}
                         </button>
                    </div>

                    {totalAttachments > 0 ? (
                         <div className="space-y-2">
                              {localFilePreviews.map((lp) => (
                                   <div key={lp.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                             <span className="text-2xl flex items-center justify-center w-8 h-8">{getFileIcon(lp.file.type)}</span>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-slate-200 truncate">{lp.file.name}</p>
                                                  <p className="text-xs text-slate-400">{formatFileSize(lp.file.size)}</p>
                                             </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             {lp.previewUrl && lp.file.type.startsWith('image/') && (
                                                  <button type="button" onClick={() => handleLocalPreviewClick(lp)} className="text-blue-400 hover:text-blue-300 p-2" title={t('common.preview')}>
                                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path
                                                                 strokeLinecap="round"
                                                                 strokeLinejoin="round"
                                                                 strokeWidth={2}
                                                                 d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                       </svg>
                                                  </button>
                                             )}
                                             <button type="button" onClick={() => onRemoveLocalFile(lp.id)} className="text-red-400 hover:text-red-300 p-2" title={t('common.delete')}>
                                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                       />
                                                  </svg>
                                             </button>
                                        </div>
                                   </div>
                              ))}

                              {Array.from(uploadingFiles).map((id) => (
                                   <div key={id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600 opacity-50">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                             <div className="w-8 h-8 flex items-center justify-center">
                                                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-slate-200">{t('attachments.uploading')}</p>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                              {attachments.map((attachment) => (
                                   <div key={attachment.id} className="bg-slate-700/50 rounded-lg border border-slate-600">
                                        <Suspense
                                             fallback={
                                                  <div className="p-3 flex items-center gap-3">
                                                       <div className="w-8 h-8 bg-slate-600 rounded animate-pulse" />
                                                       <div className="flex-1">
                                                            <div className="h-4 bg-slate-600 rounded w-3/4 animate-pulse" />
                                                            <div className="h-3 bg-slate-700 rounded w-1/2 mt-2 animate-pulse" />
                                                       </div>
                                                  </div>
                                             }
                                        >
                                             <AttachmentsList
                                                  attachments={[attachment]}
                                                  currentUser={currentUser}
                                                  taskId={taskId!}
                                                  onTaskUpdate={onTaskUpdate}
                                                  onAttachmentsUpdate={onAttachmentsUpdate}
                                                  onUploadAttachment={onUploadAttachment}
                                                  onPreviewImage={handleAttachmentPreview}
                                             />
                                        </Suspense>
                                   </div>
                              ))}
                         </div>
                    ) : (
                         <div className="text-center text-slate-400 py-8 border-2 border-dashed border-slate-600 rounded-lg bg-slate-800/30">
                              <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-slate-300 font-medium mb-1">{t('attachments.noAttachments')}</p>
                              <p className="text-sm text-slate-500">{t('attachments.addFirstAttachment')}</p>
                         </div>
                    )}
               </div>

               {allLightboxImages.length > 0 && (
                    <Lightbox
                         images={allLightboxImages}
                         currentIndex={currentImageIndex}
                         isOpen={lightboxOpen}
                         onClose={() => setLightboxOpen(false)}
                         onNavigate={(index) => setCurrentImageIndex(index)}
                    />
               )}
          </div>
     );
};

export default TaskAttachmentsSection;

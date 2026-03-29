'use client';

import { ChangeEvent, useRef, useState, useMemo, Suspense, DragEvent } from 'react';
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
     const [isDragging, setIsDragging] = useState(false);
     const dragCounter = useRef(0);

     const handleDragEnter = (e: DragEvent) => {
          e.preventDefault();
          dragCounter.current++;
          if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
     };
     const handleDragLeave = (e: DragEvent) => {
          e.preventDefault();
          dragCounter.current--;
          if (dragCounter.current === 0) setIsDragging(false);
     };
     const handleDragOver = (e: DragEvent) => { e.preventDefault(); };
     const handleDrop = async (e: DragEvent) => {
          e.preventDefault();
          setIsDragging(false);
          dragCounter.current = 0;
          const files = Array.from(e.dataTransfer.files);
          if (files.length === 0) return;

          if (!isNewTask && taskId) {
               for (const file of files) {
                    if (file.size > 10 * 1024 * 1024) { toast.error(t('attachments.fileTooLarge', { name: file.name })); continue; }
                    const tempId = crypto.randomUUID();
                    setUploadingFiles((prev) => new Set(prev).add(tempId));
                    try {
                         const attachment = await onUploadAttachment(file);
                         if (attachment) { toast.success(t('attachments.uploaded', { name: file.name })); await onAttachmentsUpdate(); }
                         else { toast.error(t('attachments.uploadFailed', { name: file.name })); }
                    } catch { toast.error(t('attachments.uploadError', { name: file.name })); }
                    finally { setUploadingFiles((prev) => { const s = new Set(prev); s.delete(tempId); return s; }); }
               }
          } else {
               onAddFiles(files);
          }
     };

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
          setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
          setLightboxOpen(true);
     };

     const totalAttachments = attachments.length + localFilePreviews.length + uploadingFiles.size;

     return (
          <div
               onDragEnter={handleDragEnter}
               onDragLeave={handleDragLeave}
               onDragOver={handleDragOver}
               onDrop={handleDrop}
          >
               <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFilesChange} accept="*/*" />

               <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                         <p className="text-xs text-slate-400">
                              {t('attachments.title', { count: totalAttachments })}
                              {totalAttachments > 0 && <span className="ml-1 text-slate-600">({totalAttachments})</span>}
                         </p>
                         <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingFiles.size > 0}
                              className="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              {uploadingFiles.size > 0 ? t('attachments.uploading') : '+ ' + t('attachments.addFile')}
                         </button>
                    </div>

                    {/* File list */}
                    {totalAttachments > 0 && (
                         <div className="space-y-1.5">
                              {/* Image thumbnails */}
                              {(() => {
                                   const imageAttachments = attachments.filter((a) => a.mime_type.startsWith('image/'));
                                   const imageLocalPreviews = localFilePreviews.filter((lp) => lp.file.type.startsWith('image/'));
                                   if (imageAttachments.length === 0 && imageLocalPreviews.length === 0) return null;
                                   return (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                             {imageLocalPreviews.map((lp) => (
                                                  <div key={lp.id} className="relative group/thumb w-16 h-16 rounded-lg overflow-hidden cursor-pointer" onClick={() => handleLocalPreviewClick(lp)}>
                                                       <img src={lp.previewUrl} alt={lp.file.name} className="w-full h-full object-cover" />
                                                       <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveLocalFile(lp.id); }} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition">
                                                            <span className="text-white text-[10px]">×</span>
                                                       </button>
                                                  </div>
                                             ))}
                                             {imageAttachments.map((att) => (
                                                  <div key={att.id} className="relative group/thumb w-16 h-16 rounded-lg overflow-hidden cursor-pointer bg-slate-800" onClick={(e) => { e.stopPropagation(); handleAttachmentPreview(att); }}>
                                                       <img src={`/api/upload?filePath=${encodeURIComponent(att.file_path)}&action=preview`} alt={att.file_name} className="w-full h-full object-cover" />
                                                  </div>
                                             ))}
                                        </div>
                                   );
                              })()}

                              {/* Non-image local previews */}
                              {localFilePreviews.filter((lp) => !lp.file.type.startsWith('image/')).map((lp) => (
                                   <div key={lp.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg group/file">
                                        <span className="text-lg">{getFileIcon(lp.file.type)}</span>
                                        <div className="flex-1 min-w-0">
                                             <p className="text-xs text-slate-200 truncate">{lp.file.name}</p>
                                             <p className="text-[10px] text-slate-500">{formatFileSize(lp.file.size)}</p>
                                        </div>
                                        <button type="button" onClick={() => onRemoveLocalFile(lp.id)} className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover/file:opacity-100">
                                             <span className="text-sm">×</span>
                                        </button>
                                   </div>
                              ))}

                              {/* Uploading indicators */}
                              {Array.from(uploadingFiles).map((id) => (
                                   <div key={id} className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg opacity-50">
                                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs text-slate-300">{t('attachments.uploading')}</p>
                                   </div>
                              ))}

                              {/* Non-image attachments */}
                              {attachments.filter((a) => !a.mime_type.startsWith('image/')).map((attachment) => (
                                   <div key={attachment.id} className="bg-slate-800 rounded-lg">
                                        <Suspense fallback={<div className="p-2 animate-pulse h-10" />}>
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
                    )}

                    {/* Drop zone - always visible */}
                    <div
                         className={`flex flex-col items-center justify-center py-6 border border-dashed rounded-lg cursor-pointer transition ${
                              isDragging
                                   ? 'border-brand-500/40 bg-brand-500/5'
                                   : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/20'
                         }`}
                         onClick={() => !isDragging && fileInputRef.current?.click()}
                    >
                         <svg className={`w-8 h-8 mb-1.5 ${isDragging ? 'text-brand-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                         </svg>
                         <p className={`text-xs ${isDragging ? 'text-brand-400' : 'text-slate-500'}`}>
                              {isDragging ? 'Upuść pliki tutaj' : <>Przeciągnij pliki lub <span className="text-slate-400">kliknij aby dodać</span></>}
                         </p>
                    </div>
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

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSubmissionMutation, useGetPrioritiesQuery, useUploadAttachmentMutation } from '@/app/store/apiSlice';
import { useRouter } from 'next/navigation';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Paperclip, X } from 'lucide-react';

interface SubmissionFormProps {
     boardId: string;
     userId: string;
     onSuccess?: () => void;
}

interface FormData {
     title: string;
     description: string;
     priorityId: string;
}

const MAX_TITLE_ATTEMPTS = 30;
const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;

function formatFileSize(bytes: number): string {
     if (bytes < 1024) return bytes + ' B';
     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
     return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const SubmissionForm = ({ boardId, userId, onSuccess }: SubmissionFormProps) => {
     const { t } = useTranslation();
     const router = useRouter();
     const [createSubmission, { isLoading }] = useCreateSubmissionMutation();
     const [uploadAttachment] = useUploadAttachmentMutation();
     const { data: priorities = [], isLoading: loadingPriorities } = useGetPrioritiesQuery();
     const fileInputRef = useRef<HTMLInputElement>(null);

     const defaultPriorityId = useMemo(() => {
          const mediumPriority = priorities.find((p) => p.label.toLowerCase() === 'średni');
          return mediumPriority?.id || priorities[1]?.id || '';
     }, [priorities]);

     const [formData, setFormData] = useState<FormData>({
          title: '',
          description: '',
          priorityId: '',
     });

     const [files, setFiles] = useState<File[]>([]);
     const [errors, setErrors] = useState<Record<string, string>>({});
     const [titleAttempts, setTitleAttempts] = useState(0);
     const [uploadingFiles, setUploadingFiles] = useState(false);

     useEffect(() => {
          if (defaultPriorityId && !formData.priorityId) {
               setFormData((prev) => ({ ...prev, priorityId: defaultPriorityId }));
          }
     }, [defaultPriorityId, formData.priorityId]);

     const validateForm = (): boolean => {
          const newErrors: Record<string, string> = {};

          const trimmedTitle = formData.title.trim();
          if (!trimmedTitle) {
               newErrors.title = t('submissions.titleRequired');
          } else if (trimmedTitle.length < MIN_TITLE_LENGTH) {
               newErrors.title = t('submissions.titleMinLength');
          }

          const trimmedDesc = formData.description.trim();
          if (!trimmedDesc) {
               newErrors.description = t('submissions.descriptionRequired');
          } else if (trimmedDesc.length < MIN_DESCRIPTION_LENGTH) {
               newErrors.description = t('submissions.descriptionMinLength');
          }

          if (!formData.priorityId) {
               newErrors.priority = t('submissions.selectPriority');
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     };

     const generateTitleWithAttempt = (baseTitle: string, attempt: number): string => {
          return attempt === 0 ? baseTitle : `${baseTitle} (${attempt})`;
     };

     const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newFiles = e.target.files;
          if (!newFiles) return;
          const valid = Array.from(newFiles).filter((f) => {
               if (f.size > 10 * 1024 * 1024) {
                    alert(`${f.name} jest za duży (max 10MB)`);
                    return false;
               }
               return true;
          });
          setFiles((prev) => [...prev, ...valid]);
          if (fileInputRef.current) fileInputRef.current.value = '';
     };

     const removeFile = (index: number) => {
          setFiles((prev) => prev.filter((_, i) => i !== index));
     };

     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();

          if (!userId || !validateForm()) {
               return;
          }

          const baseTitle = formData.title.trim();
          let attempt = 0;

          while (attempt < MAX_TITLE_ATTEMPTS) {
               const titleToUse = generateTitleWithAttempt(baseTitle, attempt);

               try {
                    const submission = await createSubmission({
                         title: titleToUse,
                         description: formData.description.trim(),
                         priority: formData.priorityId,
                         client_id: userId,
                         board_id: boardId,
                    }).unwrap();

                    // Upload attachments to the created task
                    if (files.length > 0 && submission.task_id) {
                         setUploadingFiles(true);
                         for (const file of files) {
                              try {
                                   await uploadAttachment({ file, taskId: submission.task_id }).unwrap();
                              } catch (err) {
                                   console.error('Attachment upload failed:', err);
                              }
                         }
                         setUploadingFiles(false);
                    }

                    resetForm();

                    if (onSuccess) {
                         onSuccess();
                    } else {
                         router.push('/submissions');
                    }
                    return;
               } catch (error) {
                    const err = error as FetchBaseQueryError;

                    if (err.status === 409) {
                         attempt++;
                         setTitleAttempts(attempt);
                         continue;
                    }

                    console.error('Failed to create submission:', error);
                    alert(t('submissions.submitFailed'));
                    return;
               }
          }

          alert(t('submissions.attemptLimit'));
     };

     const resetForm = () => {
          setFormData({
               title: '',
               description: '',
               priorityId: defaultPriorityId,
          });
          setFiles([]);
          setErrors({});
          setTitleAttempts(0);
     };

     const handleChange = (field: keyof FormData, value: string) => {
          setFormData((prev) => ({ ...prev, [field]: value }));

          if (errors[field]) {
               setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
               });
          }

          if (field === 'title' && titleAttempts > 0) {
               setTitleAttempts(0);
          }
     };

     const handleCancel = () => {
          router.push('/submissions');
     };

     const isFormDisabled = isLoading || loadingPriorities || uploadingFiles;
     const currentPriorityValue = formData.priorityId || defaultPriorityId;

     return (
          <form onSubmit={handleSubmit} className="space-y-6">
               {titleAttempts > 0 && (
                    <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-200 text-sm">
                         {t('submissions.titleExists', { title: formData.title.trim(), newTitle: generateTitleWithAttempt(formData.title.trim(), titleAttempts) })}
                    </div>
               )}

               <div>
                    <label htmlFor="submission-title" className="block text-sm font-medium text-slate-200 mb-2">
                         {t('submissions.submissionTitle')}
                    </label>
                    <input
                         id="submission-title"
                         type="text"
                         value={formData.title}
                         onChange={(e) => handleChange('title', e.target.value)}
                         disabled={isFormDisabled}
                         className={`w-full px-4 py-2 bg-slate-800 border ${
                              errors.title ? 'border-red-500' : 'border-slate-700'
                         } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                         placeholder={t('submissions.shortDescription')}
                         aria-invalid={!!errors.title}
                         aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                    {errors.title && (
                         <p id="title-error" className="mt-1 text-sm text-red-400">
                              {errors.title}
                         </p>
                    )}
               </div>

               <div>
                    <label htmlFor="submission-description" className="block text-sm font-medium text-slate-200 mb-2">
                         {t('submissions.detailedDescription')}
                    </label>
                    <textarea
                         id="submission-description"
                         value={formData.description}
                         onChange={(e) => handleChange('description', e.target.value)}
                         disabled={isFormDisabled}
                         rows={6}
                         className={`w-full px-4 py-2 bg-slate-800 border ${
                              errors.description ? 'border-red-500' : 'border-slate-700'
                         } rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                         placeholder={t('submissions.describeExactly')}
                         aria-invalid={!!errors.description}
                         aria-describedby={errors.description ? 'description-error' : undefined}
                    />
                    {errors.description && (
                         <p id="description-error" className="mt-1 text-sm text-red-400">
                              {errors.description}
                         </p>
                    )}
               </div>

               <div>
                    <label htmlFor="submission-priority" className="block text-sm font-medium text-slate-200 mb-2">
                         {t('submissions.priorityLabel')}
                    </label>
                    {loadingPriorities ? (
                         <div className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400">{t('submissions.loadingPriorities')}</div>
                    ) : (
                         <select
                              id="submission-priority"
                              value={currentPriorityValue}
                              onChange={(e) => handleChange('priorityId', e.target.value)}
                              disabled={isFormDisabled}
                              className={`w-full px-4 py-2 bg-slate-800 border ${
                                   errors.priority ? 'border-red-500' : 'border-slate-700'
                              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                              aria-invalid={!!errors.priority}
                              aria-describedby={errors.priority ? 'priority-error' : undefined}
                         >
                              <option value="" disabled>
                                   {t('submissions.selectPriorityPlaceholder')}
                              </option>
                              {priorities.map((priority) => (
                                   <option key={priority.id} value={priority.id}>
                                        {priority.label}
                                   </option>
                              ))}
                         </select>
                    )}
                    {errors.priority && (
                         <p id="priority-error" className="mt-1 text-sm text-red-400">
                              {errors.priority}
                         </p>
                    )}
               </div>

               {/* Attachments */}
               <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                         Załączniki
                    </label>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAddFiles} />

                    {files.length > 0 && (
                         <div className="space-y-2 mb-3">
                              {files.map((file, idx) => (
                                   <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                                        <div className="flex items-center gap-2 min-w-0">
                                             <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                             <span className="text-sm text-slate-200 truncate">{file.name}</span>
                                             <span className="text-xs text-slate-500 shrink-0">{formatFileSize(file.size)}</span>
                                        </div>
                                        <button type="button" onClick={() => removeFile(idx)} className="p-1 text-slate-500 hover:text-red-400 transition shrink-0">
                                             <X className="w-4 h-4" />
                                        </button>
                                   </div>
                              ))}
                         </div>
                    )}

                    <button
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         disabled={isFormDisabled}
                         className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                         <Paperclip className="w-4 h-4" />
                         Dodaj pliki (max 10MB)
                    </button>
               </div>

               <div className="flex gap-3 pt-4">
                    <button
                         type="submit"
                         disabled={isFormDisabled}
                         className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                         {uploadingFiles ? 'Wysyłanie załączników...' : isLoading ? t('submissions.submitting') : t('submissions.submitForm')}
                    </button>
                    <button
                         type="button"
                         onClick={handleCancel}
                         disabled={isLoading}
                         className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                         {t('common.cancel')}
                    </button>
               </div>
          </form>
     );
};

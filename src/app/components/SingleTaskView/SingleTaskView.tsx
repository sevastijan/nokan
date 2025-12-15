'use client';

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { FaCalendarAlt } from 'react-icons/fa';

import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useTaskManagement } from './hooks/useTaskManagement';
import { useTaskAssignees } from './hooks/useTaskAssignees';
import { useTaskStatus } from './hooks/useTaskStatus';
import { useAutosave } from './hooks/useAutosave';
import { useTaskForm } from './hooks/useTaskForm';
import { useAttachmentUpload } from './hooks/useAttachmentUpload';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';

import StatusSelector from './StatusSelector';
import CommentsSection from './CommentsSection';
import ImagePreviewModal from './ImagePreviewModal';
import ActionFooter from './ActionFooter';
import RecurringTaskModal from './RecurringTaskModal';
import TaskMetadataSidebar from './TaskMetadataSidebar';
import TaskDescription from './TaskDescription';
import TaskDatesSection from './TaskDatesSection';
import TaskPropertiesGrid from './TaskPropertiesGrid';
import TaskAttachmentsSection from './TaskAttachmentsSection';
import TaskHeader from './TaskHeader';
import { UnsavedChangesModal } from './UnsavedChangesModal';

import { calculateDuration } from '@/app/utils/helpers';
import { SingleTaskViewProps, Column } from '@/app/types/globalTypes';

const SingleTaskView = ({
     taskId,
     mode,
     columnId,
     boardId,
     onClose,
     onTaskUpdate,
     onTaskAdded,
     currentUser: propCurrentUser,
     initialStartDate,
     columns,
     statuses: propStatuses,
}: SingleTaskViewProps & { columns: Column[] }) => {
     const { currentUser } = useCurrentUser();

     const {
          task,
          saving,
          hasUnsavedChanges,
          isNewTask,
          updateTask,
          saveNewTask,
          saveExistingTask,
          deleteTask,
          fetchTaskData,
          teamMembers,
          updateTaskMutation,
          currentTaskId,
          uploadAttachmentMutation,
          uploadAttachment,
          autoSaveTask,
     } = useTaskManagement({
          taskId,
          mode,
          columnId,
          boardId: boardId!,
          currentUser: propCurrentUser || currentUser || undefined,
          initialStartDate,
          onTaskUpdate,
          onTaskAdded,
          onClose,
          propStatuses,
     });

     const overlayRef = useRef<HTMLDivElement>(null);
     const modalRef = useRef<HTMLDivElement>(null);
     const titleInputRef = useRef<HTMLInputElement>(null);
     const appliedInitialDate = useRef(false);

     const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
     const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
     const [showRecurringModal, setShowRecurringModal] = useState(false);

     const { formData, updateField, syncWithTask } = useTaskForm({
          initialColumnId: columnId,
     });

     const { localFilePreviews, addFiles, removeFile, uploadAllAttachments, cleanupPreviews } = useAttachmentUpload({
          uploadAttachmentMutation,
          onTaskUpdate: fetchTaskData,
     });

     const { handleAssigneesChange } = useTaskAssignees({
          isNewTask,
          currentTaskId,
          boardId: boardId!,
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
          taskTitle: task?.title ?? undefined,
          fetchTaskData,
          updateTask,
          teamMembers,
          selectedAssignees: formData.selectedAssignees,
          setSelectedAssignees: (assignees) => updateField('selectedAssignees', assignees),
     });

     const { handleStatusChange } = useTaskStatus({
          isNewTask,
          currentTaskId,
          task,
          currentUserId: currentUser?.id,
          boardId: boardId!,
          updateTask,
          updateTaskMutation,
          fetchTaskData,
     });

     const { isAutoSaving } = useAutosave({
          callback: autoSaveTask,
          delay: 3500,
          shouldSave: hasUnsavedChanges && !isNewTask && !showRecurringModal,
     });

     useEffect(() => {
          if (task) syncWithTask(task, columnId);
     }, [task, columnId, syncWithTask]);

     useEffect(() => {
          if (isNewTask && columnId) {
               updateField('localColumnId', columnId);
               updateTask({ column_id: columnId });
          }
     }, [isNewTask, columnId, updateTask, updateField]);

     useEffect(() => {
          if (isNewTask && initialStartDate && !appliedInitialDate.current) {
               updateField('startDate', initialStartDate);
               updateTask({ start_date: initialStartDate });
               appliedInitialDate.current = true;
          }
     }, [isNewTask, initialStartDate, updateTask, updateField]);

     useEffect(() => {
          if (isNewTask && !formData.localColumnId && columns.length > 0) {
               const defaultCol = columns[0].id;
               updateField('localColumnId', defaultCol);
               updateTask({ column_id: defaultCol });
          }
     }, [isNewTask, formData.localColumnId, columns, updateTask, updateField]);

     useEffect(() => {
          if (isNewTask && titleInputRef.current) {
               titleInputRef.current.focus({ preventScroll: true });
          }
     }, [isNewTask]);

     useEffect(() => {
          const originalOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          return () => {
               document.body.style.overflow = originalOverflow;
          };
     }, []);

     useEffect(() => cleanupPreviews, [cleanupPreviews]);

     const requestClose = useCallback(() => {
          if (hasUnsavedChanges && !isNewTask) {
               setShowUnsavedConfirm(true);
          } else {
               onClose();
          }
     }, [hasUnsavedChanges, isNewTask, onClose]);

     useEffect(() => {
          const onKeyDown = (e: KeyboardEvent) => {
               if (e.key === 'Escape') requestClose();
          };
          document.addEventListener('keydown', onKeyDown);
          return () => document.removeEventListener('keydown', onKeyDown);
     }, [requestClose]);

     const confirmExit = useCallback(() => {
          setShowUnsavedConfirm(false);
          onClose();
     }, [onClose]);

     const saveAndExit = useCallback(async () => {
          setShowUnsavedConfirm(false);
          const success = await saveExistingTask();
          if (success) {
               toast.success('Zapisano i zamknięto');
               onClose();
          }
     }, [saveExistingTask, onClose]);

     useOutsideClick([modalRef], requestClose);

     const handlePriorityChange = useCallback(
          (priorityId: string | null) => {
               updateTask({ priority: priorityId });
          },
          [updateTask],
     );

     const handleColumnChange = useCallback(
          async (newColId: string) => {
               updateField('localColumnId', newColId);
               await updateTask({ column_id: newColId });
          },
          [updateTask, updateField],
     );

     const handleDateChange = useCallback(
          (type: 'start' | 'end', value: string) => {
               if (type === 'start') {
                    updateField('startDate', value);
                    updateTask({ start_date: value });
                    if (formData.endDate && value && formData.endDate < value) {
                         updateField('endDate', '');
                         updateTask({ end_date: null });
                    }
               } else {
                    updateField('endDate', value);
                    updateTask({ end_date: value });
               }
          },
          [updateTask, updateField, formData.endDate],
     );

     const handleSave = useCallback(async () => {
          if (!formData.tempTitle.trim()) {
               toast.error('Tytuł jest wymagany');
               return;
          }
          if (isNewTask && !formData.localColumnId) {
               toast.error('Kolumna jest wymagana');
               return;
          }

          const success = isNewTask ? await saveNewTask() : await saveExistingTask();
          if (!success) return;

          if (isNewTask && localFilePreviews.length > 0 && currentTaskId) {
               const { errors } = await uploadAllAttachments(localFilePreviews, currentTaskId);
               toast.success(errors > 0 ? `Zadanie utworzone, ale ${errors} załącznik(ów) nie zostało przesłanych` : 'Zadanie utworzone wraz z załącznikami');
          } else {
               toast.success(isNewTask ? 'Zadanie utworzone' : 'Zadanie zaktualizowane');
          }

          onClose();
     }, [formData.tempTitle, formData.localColumnId, isNewTask, saveNewTask, saveExistingTask, localFilePreviews, currentTaskId, uploadAllAttachments, onClose]);

     const handleDelete = useCallback(async () => {
          try {
               await deleteTask();
               onClose();
          } catch {
               toast.error('Nie udało się usunąć zadania');
          }
     }, [deleteTask, onClose]);

     const handleCopyLink = useCallback(() => {
          if (!task?.id) return;
          const url = `${window.location.origin}/task/${task.id}`;
          navigator.clipboard
               .writeText(url)
               .then(() => toast.success('Link do zadania skopiowany!'))
               .catch(() => toast.error('Nie udało się skopiować linku'));
     }, [task?.id]);

     const duration = useMemo(() => calculateDuration(formData.startDate, formData.endDate), [formData.startDate, formData.endDate]);

     const user = currentUser!;

     return (
          <AnimatePresence initial={false}>
               <motion.div
                    ref={overlayRef}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    onClick={(e) => e.target === overlayRef.current && requestClose()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
               >
                    <motion.div
                         ref={modalRef}
                         className="bg-slate-800 rounded-xl w-full max-w-lg md:max-w-3xl lg:max-w-6xl max-h-screen flex flex-col shadow-xl border border-slate-600 overflow-hidden"
                         initial={{ scale: 0.95, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 0.95, opacity: 0 }}
                    >
                         <TaskHeader
                              isNewTask={isNewTask}
                              taskId={task?.id}
                              title={formData.tempTitle}
                              onTitleChange={(e) => {
                                   const value = e.target.value;
                                   updateField('tempTitle', value);
                                   updateTask({ title: value });
                              }}
                              onTitleKeyDown={(e) => {
                                   if (e.key === 'Enter' && formData.tempTitle.trim()) {
                                        (e.target as HTMLInputElement).blur();
                                   }
                              }}
                              onCopyLink={handleCopyLink}
                              hasUnsavedChanges={hasUnsavedChanges}
                              saving={saving}
                              onClose={requestClose}
                              titleInputRef={titleInputRef}
                         />

                         <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
                                   <TaskPropertiesGrid
                                        selectedAssignees={formData.selectedAssignees}
                                        availableUsers={teamMembers}
                                        onAssigneesChange={handleAssigneesChange}
                                        selectedPriority={task?.priority ?? null}
                                        onPriorityChange={handlePriorityChange}
                                        columns={columns}
                                        localColumnId={formData.localColumnId}
                                        onColumnChange={handleColumnChange}
                                   />

                                   {task?.statuses && task.statuses.length > 0 && (
                                        <div className="mt-6">
                                             <StatusSelector
                                                  statuses={task.statuses}
                                                  selectedStatusId={task.status_id || null}
                                                  onChange={handleStatusChange}
                                                  onStatusesChange={(newStatuses) => updateTask({ statuses: newStatuses })}
                                                  boardId={boardId}
                                                  disabled={false}
                                                  label="Status"
                                             />
                                        </div>
                                   )}

                                   <TaskDescription
                                        value={formData.tempDescription}
                                        onChange={(value) => {
                                             updateField('tempDescription', value);
                                             updateTask({ description: value });
                                        }}
                                   />

                                   <TaskDatesSection startDate={formData.startDate} endDate={formData.endDate} onDateChange={handleDateChange} />

                                   {duration !== null && (
                                        <div className="p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 flex items-center gap-2">
                                             <FaCalendarAlt className="text-white w-4 h-4" />
                                             <span className="font-medium">
                                                  Czas trwania: {duration} {duration === 1 ? 'dzień' : 'dni'}
                                             </span>
                                        </div>
                                   )}

                                   <Suspense fallback={<div className="text-slate-400 text-sm">Ładowanie załączników...</div>}>
                                        <TaskAttachmentsSection
                                             isNewTask={isNewTask}
                                             taskId={task?.id}
                                             attachments={task?.attachments || []}
                                             localFilePreviews={localFilePreviews}
                                             onAddFiles={addFiles}
                                             onRemoveLocalFile={removeFile}
                                             currentUser={user}
                                             onTaskUpdate={fetchTaskData}
                                             onAttachmentsUpdate={fetchTaskData}
                                             onUploadAttachment={uploadAttachment}
                                        />
                                   </Suspense>

                                   {!isNewTask && task?.id && (
                                        <div className="mt-6">
                                             <Suspense fallback={<div className="animate-pulse text-slate-400">Ładowanie komentarzy...</div>}>
                                                  <CommentsSection
                                                       taskId={task.id}
                                                       comments={task.comments || []}
                                                       currentUser={user}
                                                       task={task}
                                                       onRefreshComments={fetchTaskData}
                                                       onImagePreview={(url) => setPreviewImageUrl(url)}
                                                       teamMembers={teamMembers}
                                                  />
                                             </Suspense>
                                        </div>
                                   )}
                              </div>

                              {!isNewTask && task && (
                                   <TaskMetadataSidebar
                                        task={{
                                             creator: task.creator ?? null,
                                             created_at: task.created_at ?? null,
                                             updated_at: task.updated_at ?? null,
                                             start_date: task.start_date ?? null,
                                             end_date: task.end_date ?? null,
                                             is_recurring: task.is_recurring ?? false,
                                             recurrence_interval: task.recurrence_interval ?? null,
                                             recurrence_type: task.recurrence_type ?? null,
                                             collaborators: task.collaborators ?? null,
                                        }}
                                        columns={columns}
                                        selectedAssignees={task.collaborators ?? []}
                                        localColumnId={formData.localColumnId}
                                        onRecurringModalOpen={() => setShowRecurringModal(true)}
                                   />
                              )}
                         </div>

                         <ActionFooter
                              isNewTask={isNewTask}
                              hasUnsavedChanges={hasUnsavedChanges}
                              isSaving={saving || isAutoSaving}
                              onSave={handleSave}
                              onClose={requestClose}
                              onDelete={isNewTask ? undefined : handleDelete}
                              task={task ?? undefined}
                              tempTitle={formData.tempTitle}
                         />

                         <RecurringTaskModal
                              isOpen={showRecurringModal}
                              onClose={() => setShowRecurringModal(false)}
                              isRecurring={task?.is_recurring || false}
                              onToggleRecurring={(value) => updateTask({ is_recurring: value })}
                              recurrenceInterval={task?.recurrence_interval ?? 1}
                              onChangeInterval={(value) => updateTask({ recurrence_interval: value })}
                              recurrenceType={task?.recurrence_type || 'weekly'}
                              onChangeType={(value) => updateTask({ recurrence_type: value })}
                              recurrenceColumnId={task?.recurrence_column_id}
                              currentColumnId={task?.column_id ?? undefined}
                              onChangeColumn={(colId) => updateTask({ recurrence_column_id: colId })}
                              columns={columns}
                         />
                    </motion.div>

                    {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}

                    <UnsavedChangesModal
                         isOpen={showUnsavedConfirm}
                         onClose={() => setShowUnsavedConfirm(false)}
                         onConfirmExit={confirmExit}
                         onSaveAndExit={saveAndExit}
                         isSaving={saving || isAutoSaving}
                    />
               </motion.div>
          </AnimatePresence>
     );
};

export default SingleTaskView;

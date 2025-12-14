'use client';

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { FaCalendarAlt, FaClock, FaLink, FaTimes } from 'react-icons/fa';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useTaskManagement } from './hooks/useTaskManagement';
import UserSelector from './UserSelector';
import PrioritySelector from './PrioritySelector';
import { useUpdateTaskCollaboratorsMutation } from '@/app/store/apiSlice';
import { triggerEmailNotification } from '@/app/lib/email/triggerNotification';
import StatusSelector from './StatusSelector';
import CommentsSection from './CommentsSection';
import AttachmentsList from './AttachmentsList';
import ImagePreviewModal from './ImagePreviewModal';
import Button from '../Button/Button';
import ColumnSelector from '@/app/components/ColumnSelector';
import ActionFooter from './ActionFooter';
import RecurringTaskModal from './RecurringTaskModal';
import TaskMetadataSidebar from './TaskMetadataSidebar';

import { calculateDuration, copyTaskUrlToClipboard, formatFileSize, getFileIcon } from '@/app/utils/helpers';
import { SingleTaskViewProps } from '@/app/types/globalTypes';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import { Column } from '@/app/types/globalTypes';

interface LocalFilePreview {
     id: string;
     file: File;
     previewUrl: string;
}

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
     const { currentUser, loading: userLoading } = useCurrentUser();

     const {
          task,
          loading,
          saving,
          error,
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
     const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
     const fileInputRef = useRef<HTMLInputElement>(null);

     const [updateCollaboratorsMutation] = useUpdateTaskCollaboratorsMutation();

     const [localFilePreviews, setLocalFilePreviews] = useState<LocalFilePreview[]>([]);
     const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
     const [tempTitle, setTempTitle] = useState('');
     const [tempDescription, setTempDescription] = useState('');
     const [selectedAssignees, setSelectedAssignees] = useState<typeof teamMembers>([]);
     const [startDate, setStartDate] = useState<string>('');
     const [endDate, setEndDate] = useState<string>('');
     const [localColumnId, setLocalColumnId] = useState<string | undefined>(columnId);

     const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
     const [isAutoSaving] = useState(false);
     const [showRecurringModal, setShowRecurringModal] = useState(false);

     const appliedInitialDate = useRef(false);

     useEffect(() => {
          if (task) {
               setTempTitle(task.title || '');
               setTempDescription(task.description || '');
               setSelectedAssignees(task.collaborators || []);
               setLocalColumnId(task.column_id || columnId);
               setStartDate(task.start_date || '');
               setEndDate(task.end_date || '');
          }
     }, [task, columnId]);

     useEffect(() => {
          if (isNewTask && columnId) {
               setLocalColumnId(columnId);
               updateTask({ column_id: columnId });
          }
     }, [isNewTask, columnId, updateTask]);

     useEffect(() => {
          if (isNewTask && initialStartDate && !appliedInitialDate.current) {
               setStartDate(initialStartDate);
               updateTask({ start_date: initialStartDate });
               appliedInitialDate.current = true;
          }
     }, [isNewTask, initialStartDate, updateTask]);

     useEffect(() => {
          if (isNewTask && !localColumnId && columns.length > 0) {
               const defaultCol = columns[0].id;
               setLocalColumnId(defaultCol);
               updateTask({ column_id: defaultCol });
          }
     }, [isNewTask, localColumnId, columns, updateTask]);

     useEffect(() => {
          const onKeyDown = (e: KeyboardEvent) => {
               if (e.key === 'Escape') requestClose();
          };
          document.addEventListener('keydown', onKeyDown);
          return () => document.removeEventListener('keydown', onKeyDown);
     }, []);

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

     const requestClose = useCallback(() => {
          if (autosaveTimerRef.current) {
               clearTimeout(autosaveTimerRef.current);
               autosaveTimerRef.current = null;
          }

          if (hasUnsavedChanges && !isNewTask) {
               setShowUnsavedConfirm(true);
          } else {
               onClose();
          }
     }, [hasUnsavedChanges, isNewTask, onClose]);

     const confirmExit = useCallback(() => {
          if (autosaveTimerRef.current) {
               clearTimeout(autosaveTimerRef.current);
               autosaveTimerRef.current = null;
          }
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

     useEffect(() => {
          if (isNewTask || !hasUnsavedChanges || showRecurringModal) {
               if (autosaveTimerRef.current) {
                    clearTimeout(autosaveTimerRef.current);
                    autosaveTimerRef.current = null;
               }
               return;
          }

          if (autosaveTimerRef.current) {
               clearTimeout(autosaveTimerRef.current);
          }

          autosaveTimerRef.current = setTimeout(async () => {
               try {
                    await autoSaveTask();
                    toast.success('Zapisano automatycznie');
               } catch (err) {
                    console.error('Autosave failed:', err);
               } finally {
                    autosaveTimerRef.current = null;
               }
          }, 3500);

          return () => {
               if (autosaveTimerRef.current) {
                    clearTimeout(autosaveTimerRef.current);
                    autosaveTimerRef.current = null;
               }
          };
     }, [hasUnsavedChanges, isNewTask, autoSaveTask, showRecurringModal]);

     useOutsideClick([modalRef], requestClose);

     const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setTempTitle(value);
          updateTask({ title: value });
     };

     const handleTitleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && tempTitle.trim()) {
               (e.target as HTMLInputElement).blur();
          }
     };

     const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
          const value = e.target.value;
          setTempDescription(value);
          updateTask({ description: value });
     };

     const handleAssigneesChange = async (userIds: string[]) => {
          const prevAssigneeIds = selectedAssignees.map((a) => a.id);
          const newAssignees = teamMembers.filter((u) => userIds.includes(u.id));
          setSelectedAssignees(newAssignees);
          updateTask({ collaborators: newAssignees });

          if (!isNewTask && currentTaskId && task) {
               try {
                    await updateCollaboratorsMutation({
                         taskId: currentTaskId,
                         collaboratorIds: userIds,
                         boardId: boardId!,
                    }).unwrap();

                    await fetchTaskData();

                    const addedIds = userIds.filter((id) => !prevAssigneeIds.includes(id));
                    const removedIds = prevAssigneeIds.filter((id) => !userIds.includes(id));

                    for (const addedId of addedIds) {
                         if (addedId !== currentUser?.id) {
                              triggerEmailNotification({
                                   type: 'collaborator_added',
                                   taskId: currentTaskId,
                                   taskTitle: task.title || 'Task',
                                   boardId: boardId!,
                                   recipientId: addedId,
                                   metadata: { adderName: currentUser?.name || 'Ktoś' },
                              });
                         }
                    }

                    for (const removedId of removedIds) {
                         if (removedId !== currentUser?.id) {
                              triggerEmailNotification({
                                   type: 'collaborator_removed',
                                   taskId: currentTaskId,
                                   taskTitle: task.title || 'Task',
                                   boardId: boardId!,
                                   recipientId: removedId,
                                   metadata: { removerName: currentUser?.name || 'Ktoś' },
                              });
                         }
                    }

                    toast.success('Przypisani zaktualizowani');
               } catch (error) {
                    console.error('Failed to update assignees:', error);
                    toast.error('Nie udało się zaktualizować przypisanych');
               }
          }
     };

     const handlePriorityChange = (priorityId: string | null) => {
          updateTask({ priority: priorityId });
     };

     const handleColumnChange = async (newColId: string) => {
          setLocalColumnId(newColId);
          await updateTask({ column_id: newColId });
     };

     const handleStatusChange = async (newStatusId: string) => {
          const oldStatusId = task?.status_id;
          updateTask({ status_id: newStatusId });

          if (!isNewTask && currentTaskId && task) {
               try {
                    await updateTaskMutation({
                         taskId: currentTaskId,
                         data: { status_id: newStatusId },
                    }).unwrap();
                    await fetchTaskData();

                    if (oldStatusId !== newStatusId) {
                         const oldStatusLabel = task.statuses?.find((s) => s.id === oldStatusId)?.label || 'Nieznany';
                         const newStatusLabel = task.statuses?.find((s) => s.id === newStatusId)?.label || 'Nieznany';

                         if (task.user_id && task.user_id !== currentUser?.id && boardId) {
                              fetch('/api/notifications/email', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                        type: 'status_changed',
                                        taskId: currentTaskId,
                                        taskTitle: task.title || 'Task',
                                        boardId,
                                        recipientId: task.user_id,
                                        metadata: { oldStatus: oldStatusLabel, newStatus: newStatusLabel },
                                   }),
                              }).catch((e) => console.error('Email notification failed:', e));
                         }

                         if (task.created_by && task.created_by !== currentUser?.id && task.created_by !== task.user_id && boardId) {
                              fetch('/api/notifications/email', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                        type: 'status_changed',
                                        taskId: currentTaskId,
                                        taskTitle: task.title || 'Task',
                                        boardId,
                                        recipientId: task.created_by,
                                        metadata: { oldStatus: oldStatusLabel, newStatus: newStatusLabel },
                                   }),
                              }).catch((e) => console.error('Email notification failed:', e));
                         }
                    }
               } catch (error) {
                    console.error('Failed to save status:', error);
                    toast.error('Nie udało się zapisać statusu');
               }
          }
     };

     const handleDateChange = (type: 'start' | 'end', value: string) => {
          if (type === 'start') {
               setStartDate(value);
               updateTask({ start_date: value });
               if (endDate && value && endDate < value) {
                    setEndDate('');
                    updateTask({ end_date: null });
               }
          } else {
               setEndDate(value);
               updateTask({ end_date: value });
          }
     };

     const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (!files) return;

          const previews: LocalFilePreview[] = [];
          for (let i = 0; i < files.length; i++) {
               const file = files[i];
               const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
               previews.push({ id: crypto.randomUUID(), file, previewUrl });
          }
          setLocalFilePreviews((prev) => [...prev, ...previews]);
          if (fileInputRef.current) fileInputRef.current.value = '';
     };

     const removeLocalFile = (id: string) => {
          setLocalFilePreviews((prev) => {
               const removed = prev.find((f) => f.id === id);
               if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
               return prev.filter((f) => f.id !== id);
          });
     };

     const handleSave = async () => {
          if (!tempTitle.trim()) {
               toast.error('Tytuł jest wymagany');
               return;
          }
          if (isNewTask && !localColumnId) {
               toast.error('Kolumna jest wymagana');
               return;
          }

          const success = isNewTask ? await saveNewTask() : await saveExistingTask();

          if (success) {
               if (isNewTask && localFilePreviews.length > 0 && currentTaskId) {
                    for (const { file, previewUrl } of localFilePreviews) {
                         try {
                              await uploadAttachmentMutation({
                                   file,
                                   taskId: currentTaskId,
                              }).unwrap();

                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                         } catch (error) {
                              console.error('Upload failed:', error);
                              toast.error(`Upload failed: ${file.name}`);
                         }
                    }
                    setLocalFilePreviews([]);
                    await fetchTaskData();
               }
               toast.success(isNewTask ? 'Zadanie utworzone' : 'Zadanie zaktualizowane');
               onClose();
          }
     };

     const handleCopyLink = () => task?.id && copyTaskUrlToClipboard(task.id);

     const handleDelete = async () => {
          try {
               await deleteTask();
               onClose();
          } catch {
               toast.error('Nie udało się usunąć zadania');
          }
     };

     if (loading)
          return (
               <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">Ładowanie zadania...</div>
               </div>
          );
     if (error)
          return (
               <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-red-400">Błąd: {error}</div>
               </div>
          );
     if (userLoading || !currentUser)
          return (
               <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-600 text-white">Ładowanie użytkownika...</div>
               </div>
          );
     if (!isNewTask && !task) return null;

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
                         className="bg-slate-800 rounded-xl w-full max-w-lg md:max-w-3xl lg:max-w-4xl h-screen max-h-screen flex flex-col shadow-xl border border-slate-600 overflow-hidden"
                         initial={{ scale: 0.95, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 0.95, opacity: 0 }}
                    >
                         <div className="flex justify-between items-start px-6 py-3 border-b border-slate-600">
                              <div className="flex justify-between gap-1.5 min-w-0 flex-1 mr-4">
                                   <div className="flex items-center gap-3 min-w-0">
                                        {isNewTask ? (
                                             <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded flex-shrink-0">Nowe</span>
                                        ) : task?.id ? (
                                             <span className="bg-slate-700 text-slate-300 text-xs font-mono px-2 py-1 rounded flex-shrink-0">#{task.id.slice(-6)}</span>
                                        ) : null}
                                        <input
                                             ref={titleInputRef}
                                             type="text"
                                             className="bg-transparent text-lg font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 truncate min-w-0 flex-1"
                                             placeholder="Tytuł zadania (wymagany)"
                                             value={tempTitle}
                                             onChange={handleTitleChange}
                                             onKeyDown={handleTitleKeyDown}
                                        />
                                   </div>
                                   {hasUnsavedChanges && !saving && (
                                        <div className="flex items-center gap-1.5 pl-0 sm:pl-[4.5rem] animate-in fade-in slide-in-from-top-1 duration-200">
                                             <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0"></span>
                                             <span className="text-xs text-amber-400 font-medium">Masz niezapisane zmiany</span>
                                        </div>
                                   )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                   {!isNewTask && task?.id && <Button variant="ghost" size="sm" icon={<FaLink />} onClick={handleCopyLink} className="text-slate-300 hover:text-white" />}
                                   <Button variant="ghost" size="sm" icon={<FaTimes />} onClick={requestClose} className="text-slate-300 hover:text-white" />
                              </div>
                         </div>

                         <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
                                   <div className="block md:hidden mb-4">
                                        <ColumnSelector columns={columns} value={localColumnId} onChange={handleColumnChange} label="Kolumna" />
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <UserSelector selectedUsers={selectedAssignees} availableUsers={teamMembers} onUsersChange={handleAssigneesChange} label="Przypisani" />
                                        <PrioritySelector selectedPriority={task?.priority ?? null} onChange={handlePriorityChange} />
                                   </div>

                                   <div className="hidden md:block">
                                        <ColumnSelector columns={columns} value={localColumnId} onChange={handleColumnChange} />
                                   </div>

                                   {task?.statuses && task.statuses.length > 0 && (
                                        <div className="mt-6">
                                             <StatusSelector
                                                  statuses={task?.statuses || []}
                                                  selectedStatusId={task?.status_id || null}
                                                  onChange={handleStatusChange}
                                                  onStatusesChange={(newStatuses) => updateTask({ statuses: newStatuses })}
                                                  boardId={boardId}
                                                  disabled={false}
                                                  label="Status"
                                             />
                                        </div>
                                   )}

                                   <div>
                                        <span className="block text-sm font-medium text-slate-300 mb-2">Opis</span>
                                        <textarea
                                             className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                             value={tempDescription}
                                             onChange={handleDescriptionChange}
                                             placeholder="Opisz zadanie..."
                                             rows={4}
                                        />
                                   </div>

                                   <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                                        <div className="flex-1">
                                             <span className="text-sm flex items-center gap-1 text-slate-300">
                                                  <FaClock className="w-4 h-4" /> Data rozpoczęcia
                                             </span>
                                             <input
                                                  type="date"
                                                  className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                  value={startDate}
                                                  onChange={(e) => handleDateChange('start', e.target.value)}
                                             />
                                        </div>
                                        <div className="flex-1">
                                             <label className="text-sm flex items-center gap-1 text-slate-300">
                                                  <FaClock className="w-4 h-4" /> Termin
                                             </label>
                                             <input
                                                  type="date"
                                                  className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                  value={endDate}
                                                  min={startDate || undefined}
                                                  onChange={(e) => handleDateChange('end', e.target.value)}
                                             />
                                        </div>
                                   </div>

                                   {(() => {
                                        const dur = calculateDuration(startDate, endDate);
                                        return dur !== null ? (
                                             <div className="p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 flex items-center gap-2">
                                                  <FaCalendarAlt className="text-white w-4 h-4" />
                                                  <span className="font-medium">
                                                       Czas trwania: {dur} {dur === 1 ? 'dzień' : 'dni'}
                                                  </span>
                                             </div>
                                        ) : null;
                                   })()}

                                   <div className="mt-4">
                                        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFilesSelected} />
                                        {isNewTask && localFilePreviews.length > 0 && (
                                             <ul className="mt-2 space-y-1">
                                                  {localFilePreviews.map((lp) => (
                                                       <li key={lp.id} className="flex items-center justify-between bg-slate-700 p-2 rounded">
                                                            <div className="flex items-center gap-2">
                                                                 <span>{getFileIcon(lp.file.type)}</span>
                                                                 <span className="text-sm text-white">
                                                                      {lp.file.name} ({formatFileSize(lp.file.size)})
                                                                 </span>
                                                            </div>
                                                            <button type="button" className="text-red-400 hover:text-red-300 text-sm" onClick={() => removeLocalFile(lp.id)}>
                                                                 Usuń
                                                            </button>
                                                       </li>
                                                  ))}
                                             </ul>
                                        )}
                                        {!isNewTask && task?.attachments && (
                                             <div className="mt-4">
                                                  <AttachmentsList
                                                       attachments={task.attachments}
                                                       currentUser={currentUser}
                                                       taskId={task.id!}
                                                       onTaskUpdate={fetchTaskData}
                                                       onAttachmentsUpdate={fetchTaskData}
                                                       onUploadAttachment={uploadAttachment}
                                                  />
                                             </div>
                                        )}
                                   </div>

                                   {!isNewTask && task?.id && (
                                        <div className="mt-6">
                                             <CommentsSection
                                                  taskId={task.id}
                                                  comments={task.comments || []}
                                                  currentUser={currentUser}
                                                  task={task}
                                                  onRefreshComments={fetchTaskData}
                                                  onImagePreview={(url) => setPreviewImageUrl(url)}
                                                  teamMembers={teamMembers}
                                             />
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
                                        localColumnId={localColumnId}
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
                              tempTitle={tempTitle}
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

                    {showUnsavedConfirm && (
                         <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="fixed inset-0 bg-black/60 flex items-center justify-center z-60"
                              onClick={() => setShowUnsavedConfirm(false)}
                         >
                              <motion.div
                                   initial={{ scale: 0.9 }}
                                   animate={{ scale: 1 }}
                                   className="bg-slate-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-500"
                                   onClick={(e) => e.stopPropagation()}
                              >
                                   <h3 className="text-xl font-semibold text-white mb-3">Niezapisane zmiany</h3>
                                   <p className="text-slate-300 mb-6">Masz niezapisane zmiany w zadaniu. Czy chcesz je zapisać przed zamknięciem?</p>
                                   <div className="flex justify-end gap-3">
                                        <Button variant="ghost" onClick={confirmExit} className="text-slate-300 hover:text-white">
                                             Wyjdź bez zapisu
                                        </Button>
                                        <Button variant="primary" onClick={saveAndExit} disabled={saving || isAutoSaving}>
                                             {saving || isAutoSaving ? 'Zapisywanie...' : 'Zapisz i wyjdź'}
                                        </Button>
                                   </div>
                              </motion.div>
                         </motion.div>
                    )}
               </motion.div>
          </AnimatePresence>
     );
};

export default SingleTaskView;

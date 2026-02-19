'use client';

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FiLayers, FiMessageCircle, FiPaperclip } from 'react-icons/fi';

import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { extractMentionedUserIds } from '@/app/lib/mentionUtils';
import { useAddNotificationMutation } from '@/app/store/apiSlice';
import { triggerEmailNotification } from '@/app/lib/email/triggerNotification';
import { useTaskManagement } from './hooks/useTaskManagement';
import { useTaskAssignees } from './hooks/useTaskAssignees';
import { useTaskStatus } from './hooks/useTaskStatus';
import { useAutosave } from './hooks/useAutosave';
import { useTaskForm } from './hooks/useTaskForm';
import { useAttachmentUpload } from './hooks/useAttachmentUpload';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import { useTaskImages } from '@/app/hooks/useTaskImages';
import StatusSelector from './StatusSelector';
import CommentsSection from './CommentsSection';
import ImagePreviewModal from './ImagePreviewModal';
import ActionFooter from './ActionFooter';
import RecurringTaskModal from './RecurringTaskModal';
import TaskMetadataSidebar from './TaskMetadataSidebar';
import TaskDescription from './TaskDescription/TaskDescription';
import TaskDatesSection from './TaskDatesSection';
import TaskPropertiesGrid from './TaskPropertiesGrid';
import TaskAttachmentsSection from './TaskAttachmentsSection';
import TaskHeader from './TaskHeader';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import TaskTypeSelector from './TaskTypeSelector';
import TaskVariantSelector from './TaskVariantSelector';
import BugFields from './BugFields';
import SubtaskList from './SubtaskList';
import Lightbox from '@/app/components/Lightbox/Lightbox';
import { SingleTaskViewProps, Column, TaskType, User } from '@/app/types/globalTypes';
import TaskHistory from './TaskHistory';
import TaskViewSkeleton from './TaskViewSkeleton';
import { useGetSubtasksQuery, useUpdateTaskTypeMutation } from '@/app/store/apiSlice';

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
     onOpenTask,
}: SingleTaskViewProps & { columns: Column[] }) => {
     const { t } = useTranslation();
     const { currentUser } = useCurrentUser();
     const user = propCurrentUser || currentUser!;

     const overlayRef = useRef<HTMLDivElement>(null);
     const modalRef = useRef<HTMLDivElement>(null);
     const titleInputRef = useRef<HTMLInputElement>(null);
     const appliedInitialDate = useRef(false);
     const isInitialMount = useRef(true);

     const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
     const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
     const [showRecurringModal, setShowRecurringModal] = useState(false);
     const [openedSubtaskId, setOpenedSubtaskId] = useState<string | null>(null);
     const [isVisible, setIsVisible] = useState(true);
     const [variantChosen, setVariantChosen] = useState(mode !== 'add');

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
          boardData,
     } = useTaskManagement({
          taskId,
          mode,
          columnId,
          boardId: boardId!,
          currentUser: user,
          initialStartDate,
          onTaskUpdate,
          onTaskAdded,
          onClose,
          propStatuses,
     });

     const availableUsers = useMemo((): User[] => {
          const users = [...teamMembers];
          // Always include current user so they can assign themselves
          if (user && !users.some((m) => m.id === user.id)) {
               users.push(user);
          }
          // Include existing task collaborators (e.g. users who left the team)
          if (task?.collaborators) {
               for (const collab of task.collaborators) {
                    if (!users.some((u) => u.id === collab.id)) {
                         users.push(collab);
                    }
               }
          }
          return users;
     }, [teamMembers, user, task?.collaborators]);

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
          currentUserId: user?.id,
          currentUserName: user?.name,
          taskTitle: task?.title ?? undefined,
          fetchTaskData,
          updateTask,
          teamMembers: availableUsers,
          selectedAssignees: formData.selectedAssignees,
          setSelectedAssignees: (assignees) => updateField('selectedAssignees', assignees),
     });

     const { handleStatusChange: rawHandleStatusChange } = useTaskStatus({
          isNewTask,
          currentTaskId,
          task,
          currentUserId: user?.id,
          boardId: boardId!,
          updateTask,
          updateTaskMutation,
          fetchTaskData,
     });

     // Wrap status change to also sync column — find column matching the new status label
     const handleStatusChange = useCallback(
          async (newStatusId: string) => {
               const newStatus = task?.statuses?.find((s) => s.id === newStatusId);
               if (newStatus) {
                    const matchingColumn = columns.find((c) => c.title?.toLowerCase() === newStatus.label.toLowerCase());
                    if (matchingColumn && matchingColumn.id !== formData.localColumnId) {
                         updateField('localColumnId', matchingColumn.id);
                         updateTask({ column_id: matchingColumn.id });
                    }
               }
               await rawHandleStatusChange(newStatusId);
          },
          [rawHandleStatusChange, task?.statuses, columns, formData.localColumnId, updateField, updateTask],
     );

     const { isAutoSaving } = useAutosave({
          callback: autoSaveTask,
          delay: 3500,
          shouldSave: hasUnsavedChanges && !isNewTask && !showRecurringModal,
     });

     const [addNotification] = useAddNotificationMutation();
     const notifiedDescMentions = useRef(new Set<string>());

     const taskType: TaskType = task?.type || 'task';
     const isStory = taskType === 'story';
     const isBug = taskType === 'bug';
     const [updateTaskType] = useUpdateTaskTypeMutation();

     const { data: subtasks = [], refetch: refetchSubtasks } = useGetSubtasksQuery({ storyId: task?.id || '' }, { skip: !task?.id || !isStory });

     // Duration is now calculated inside TaskDatesSection - no need for duplicate here

     const canChangeType = useMemo(() => {
          if (!isStory) return true;
          return subtasks.length === 0;
     }, [isStory, subtasks.length]);

     const {
          images: descriptionImages,
          lightboxOpen: descriptionLightboxOpen,
          currentImageIndex: descriptionImageIndex,
          handleImageClick: handleDescriptionImageClick,
          handleClose: handleDescriptionLightboxClose,
          handleNavigate: handleDescriptionImageNavigate,
     } = useTaskImages(formData.tempDescription);

     const animateOut = useCallback(() => {
          setIsVisible(false);
     }, []);

     const requestClose = useCallback(() => {
          if (hasUnsavedChanges && !isNewTask) {
               setShowUnsavedConfirm(true);
          } else {
               animateOut();
          }
     }, [hasUnsavedChanges, isNewTask, animateOut]);

     const confirmExit = useCallback(() => {
          setShowUnsavedConfirm(false);
          animateOut();
     }, [animateOut]);

     const saveAndExit = useCallback(async () => {
          setShowUnsavedConfirm(false);
          const success = await saveExistingTask();
          if (success) {
               toast.success(t('task.savedAndClosed'));
               animateOut();
          }
     }, [saveExistingTask, animateOut]);

     const handlePriorityChange = useCallback(
          (priorityId: string | null) => {
               updateTask({ priority: priorityId });
          },
          [updateTask],
     );

     const handleColumnChange = useCallback(
          (newColId: string) => {
               updateField('localColumnId', newColId);
               // Sync status with column — find status matching column title
               const column = columns.find((c) => c.id === newColId);
               const matchingStatus = column && task?.statuses ? task.statuses.find((s) => s.label.toLowerCase() === column.title?.toLowerCase()) : null;
               updateTask({
                    column_id: newColId,
                    ...(matchingStatus && { status_id: matchingStatus.id }),
               });
          },
          [updateTask, updateField, columns, task?.statuses],
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
               toast.error(t('task.titleRequired'));
               return;
          }
          if (isNewTask && !formData.localColumnId) {
               toast.error(t('task.columnRequired'));
               return;
          }
          if (task?.type === 'bug') {
               const url = formData.bugUrl.trim();
               if (!url) {
                    toast.error(t('task.bugLinkRequired'));
                    return;
               }
               try {
                    new URL(url);
               } catch {
                    toast.error(t('task.invalidUrl'));
                    return;
               }
          }

          const success = isNewTask ? await saveNewTask() : await saveExistingTask();
          if (!success) return;

          if (isNewTask && localFilePreviews.length > 0 && currentTaskId) {
               const { errors } = await uploadAllAttachments(localFilePreviews, currentTaskId);
               toast.success(errors > 0 ? t('task.createdWithErrors', { count: errors }) : t('task.createdWithAttachments'));
          } else {
               toast.success(isNewTask ? t('task.created') : t('task.updated'));
          }

          animateOut();
     }, [formData.tempTitle, formData.localColumnId, formData.bugUrl, isNewTask, task?.type, saveNewTask, saveExistingTask, localFilePreviews, currentTaskId, uploadAllAttachments, animateOut]);

     const handleDelete = useCallback(async () => {
          try {
               await deleteTask();
               animateOut();
          } catch {
               toast.error(t('task.deleteFailed'));
          }
     }, [deleteTask, animateOut]);

     const handleCopyLink = useCallback(() => {
          if (!task?.id || !boardId) return;

          const url = `${window.location.origin}/board/${boardId}?task=${task.id}`;

          navigator.clipboard
               .writeText(url)
               .then(() => toast.success(t('task.linkCopied')))
               .catch(() => toast.error(t('task.linkCopyFailed')));
     }, [task?.id, boardId]);

     const handleTypeChange = useCallback(
          async (newType: TaskType) => {
               if (!task?.id) {
                    updateTask({ type: newType });
                    return;
               }

               try {
                    await updateTaskType({ taskId: task.id, type: newType }).unwrap();
                    fetchTaskData();
                    toast.success(newType === 'story' ? t('task.changedToStory') : t('task.changedToTask'));
               } catch (error) {
                    const err = error as Error;
                    toast.error(err.message || t('task.typeFailed'));
               }
          },
          [task?.id, updateTaskType, fetchTaskData, updateTask],
     );

     const handleVariantChange = useCallback(
          (newType: TaskType) => {
               updateTask({ type: newType });
               if (newType === 'bug') {
                    updateTask({ user_id: null, assignee: null });
               }
               setVariantChosen(true);
          },
          [updateTask],
     );

     const handleBugUrlChange = useCallback(
          (value: string) => {
               updateField('bugUrl', value);
               updateTask({ bug_url: value });
          },
          [updateField, updateTask],
     );

     const handleBugScenarioChange = useCallback(
          (value: string) => {
               updateField('bugScenario', value);
               updateTask({ bug_scenario: value });
          },
          [updateField, updateTask],
     );

     const handleTitleChange = useCallback(
          (e: React.ChangeEvent<HTMLInputElement>) => {
               const value = e.target.value;
               updateField('tempTitle', value);
               updateTask({ title: value });
          },
          [updateField, updateTask],
     );

     const handleTitleKeyDown = useCallback(
          (e: React.KeyboardEvent<HTMLInputElement>) => {
               if (e.key === 'Enter' && formData.tempTitle.trim()) {
                    (e.target as HTMLInputElement).blur();
               }
          },
          [formData.tempTitle],
     );

     const handleDescriptionChange = useCallback(
          (value: string) => {
               updateField('tempDescription', value);
               updateTask({ description: value });

               // Detect new @mentions in description
               const mentionedIds = extractMentionedUserIds(value, teamMembers);
               const currentUserName = user?.custom_name || user?.name || t('common.unknown');
               const title = task?.title || formData.tempTitle || 'zadanie';

               for (const mentionedId of mentionedIds) {
                    if (mentionedId === user?.id) continue;
                    if (notifiedDescMentions.current.has(mentionedId)) continue;

                    notifiedDescMentions.current.add(mentionedId);

                    addNotification({
                         user_id: mentionedId,
                         type: 'mention',
                         task_id: task?.id,
                         board_id: boardId,
                         message: t('task.mentionInDescription', { name: currentUserName, title }),
                    });

                    if (boardId) {
                         triggerEmailNotification({
                              type: 'mention',
                              taskId: task?.id || '',
                              taskTitle: title,
                              boardId,
                              boardName: boardData?.title,
                              recipientId: mentionedId,
                              metadata: { mentionerName: currentUserName },
                         });
                    }
               }
          },
          [updateField, updateTask, teamMembers, user, task, formData.tempTitle, boardId, boardData, addNotification],
     );

     const hasIncompleteSubtasks = useMemo(() => {
          if (!isStory) return false;
          if (subtasks.length === 0) return false;
          return subtasks.some((s) => !s.completed);
     }, [isStory, subtasks]);

     const incompleteSubtaskCount = useMemo(() => {
          if (!isStory) return 0;
          return subtasks.filter((s) => !s.completed).length;
     }, [isStory, subtasks]);

     const handleCompletionToggle = useCallback(
          (completed: boolean) => {
               if (completed && hasIncompleteSubtasks) {
                    toast.error(t('task.cannotCompleteStory', { count: incompleteSubtaskCount }));
                    return;
               }
               updateTask({ completed });
          },
          [updateTask, hasIncompleteSubtasks, incompleteSubtaskCount],
     );

     useEffect(() => {
          if (task) syncWithTask(task, columnId);
     }, [task, columnId, syncWithTask]);

     useEffect(() => {
          if (!isNewTask) return;

          if (columnId) {
               updateField('localColumnId', columnId);
               updateTask({ column_id: columnId });
          } else if (!formData.localColumnId && columns.length > 0) {
               const defaultCol = columns[0].id;
               updateField('localColumnId', defaultCol);
               updateTask({ column_id: defaultCol });
          }

          if (initialStartDate && !appliedInitialDate.current) {
               updateField('startDate', initialStartDate);
               updateTask({ start_date: initialStartDate });
               appliedInitialDate.current = true;
          }
     }, [isNewTask, columnId, initialStartDate, formData.localColumnId, columns, updateTask, updateField]);

     useEffect(() => {
          if (isNewTask && variantChosen && titleInputRef.current && isInitialMount.current) {
               titleInputRef.current.focus({ preventScroll: true });
               isInitialMount.current = false;
          }
     }, [isNewTask, variantChosen]);

     useEffect(() => {
          const originalOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          return () => {
               document.body.style.overflow = originalOverflow;
          };
     }, []);

     useEffect(() => cleanupPreviews, [cleanupPreviews]);

     useEffect(() => {
          if (openedSubtaskId) return;

          const onKeyDown = (e: KeyboardEvent) => {
               if (e.key === 'Escape') {
                    e.stopPropagation();
                    requestClose();
               }
          };
          document.addEventListener('keydown', onKeyDown, { capture: true });
          return () => document.removeEventListener('keydown', onKeyDown, { capture: true });
     }, [requestClose, openedSubtaskId]);

     useOutsideClick([modalRef], requestClose, !openedSubtaskId);

     const isLoaded = Boolean(task) || isNewTask;

     return (
          <AnimatePresence onExitComplete={onClose}>
               {isVisible && (
               <motion.div
                    ref={overlayRef}
                    className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50 p-2 md:p-4"
                    onClick={(e) => {
                         if (e.target === overlayRef.current && !openedSubtaskId) {
                              requestClose();
                         }
                    }}
                    initial={false}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
               >
                    <motion.div
                         ref={modalRef}
                         className={`bg-linear-to-b from-slate-800 to-slate-850 rounded-2xl w-full max-h-[95vh] flex flex-col shadow-2xl shadow-black/40 border border-slate-700/50 overflow-hidden transition-[max-width] duration-300 ease-out ${
                              isNewTask && !variantChosen ? 'max-w-sm sm:max-w-3xl' : 'max-w-lg md:max-w-3xl lg:max-w-6xl'
                         }`}
                         initial={{ scale: 0.9, opacity: 0, y: 30 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.95, opacity: 0, y: 20 }}
                         transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                         layout
                    >
                    {!isLoaded ? (
                         <TaskViewSkeleton />
                    ) : (
                    <AnimatePresence mode="wait">
                    {isNewTask && !variantChosen ? (
                         /* ── Step 1: Variant picker screen ── */
                         <motion.div
                              key="variant-picker"
                              className="p-6 sm:p-10 sm:py-12 flex flex-col items-center relative"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.2 }}
                         >
                              <button
                                   type="button"
                                   onClick={requestClose}
                                   className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                              >
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                   </svg>
                              </button>
                              <h2 className="text-lg font-semibold text-slate-200 mb-2">{t('task.chooseType')}</h2>
                              <p className="text-sm text-slate-400 mb-8">{t('task.chooseTypeSubtitle')}</p>
                              <div className="w-full max-w-xl">
                                   <TaskVariantSelector selectedType={taskType} onChange={handleVariantChange} large />
                              </div>
                         </motion.div>
                    ) : (
                    <motion.div
                         key="task-form"
                         className="flex flex-col flex-1 overflow-hidden"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                         <TaskHeader
                              isNewTask={isNewTask}
                              taskId={task?.id}
                              boardId={boardId}
                              title={formData.tempTitle}
                              onTitleChange={handleTitleChange}
                              onTitleKeyDown={handleTitleKeyDown}
                              onCopyLink={handleCopyLink}
                              hasUnsavedChanges={hasUnsavedChanges}
                              saving={saving}
                              onClose={requestClose}
                              titleInputRef={titleInputRef}
                              completed={task?.completed || false}
                              onCompletionToggle={handleCompletionToggle}
                              completionDisabled={hasIncompleteSubtasks && !task?.completed}
                              completionDisabledTooltip={t('completion.completeSubtasksFirst')}
                         />

                         <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                              {/* Main Content Area */}
                              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-white thin-scrollbar">
                                   {/* Variant Selector - only shown for new tasks */}
                                   {isNewTask && (
                                        <TaskVariantSelector selectedType={taskType} onChange={handleVariantChange} />
                                   )}

                                   {/* Properties Section - highest z-index for dropdowns */}
                                   <div className="relative z-40">
                                        <TaskPropertiesGrid
                                             selectedAssignees={formData.selectedAssignees}
                                             availableUsers={availableUsers}
                                             onAssigneesChange={handleAssigneesChange}
                                             selectedPriority={task?.priority ?? null}
                                             onPriorityChange={handlePriorityChange}
                                             columns={columns}
                                             localColumnId={formData.localColumnId}
                                             onColumnChange={handleColumnChange}
                                             hideAssignees={isNewTask && isBug}
                                        />
                                   </div>

                                   {/* Type Section (hidden for new tasks — variant selector above handles it) */}
                                   {!isNewTask && !task?.parent_id && (
                                        <div className="relative z-30">
                                             <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                                       <div className="w-1 h-4 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full" />
                                                       <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('taskMeta.type')}</h3>
                                                  </div>
                                                  <TaskTypeSelector selectedType={taskType} onChange={handleTypeChange} disabled={!canChangeType} />
                                                  {!canChangeType && (
                                                       <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                                            <FiLayers className="w-3 h-3" />
                                                            {t('task.removeSubtasksToChangeType')}
                                                       </p>
                                                  )}
                                             </div>
                                        </div>
                                   )}

                                   {/* Status Section — commented out (unused) */}
                                   {/* {task?.statuses && task.statuses.length > 0 && (
                                        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                             <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                                  <div className="w-1 h-4 bg-linear-to-b from-yellow-500 to-orange-500 rounded-full" />
                                                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</h3>
                                             </div>
                                             <StatusSelector
                                                  statuses={task.statuses}
                                                  selectedStatusId={task.status_id || null}
                                                  onChange={handleStatusChange}
                                                  onStatusesChange={(newStatuses) => updateTask({ statuses: newStatuses })}
                                                  boardId={boardId}
                                                  disabled={false}
                                                  label=""
                                             />
                                        </div>
                                   )} */}

                                   {/* Bug Fields Section — before description for bug type */}
                                   {isBug && (
                                        <BugFields
                                             bugUrl={formData.bugUrl}
                                             bugScenario={formData.bugScenario}
                                             onBugUrlChange={handleBugUrlChange}
                                             onBugScenarioChange={handleBugScenarioChange}
                                        />
                                   )}

                                   {/* Description Section */}
                                   <div className="relative z-10 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                             <div className="w-1 h-4 bg-linear-to-b from-pink-500 to-purple-500 rounded-full" />
                                             <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('task.description')}</h3>
                                        </div>
                                        <TaskDescription
                                             value={formData.tempDescription}
                                             onChange={handleDescriptionChange}
                                             taskId={task?.id}
                                             onImageClick={handleDescriptionImageClick}
                                             teamMembers={teamMembers}
                                        />
                                   </div>

                                   {/* Subtasks Section */}
                                   {isStory && task?.id && !isNewTask && (
                                        <div className="relative z-5 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                             <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                                  <div className="w-1 h-4 bg-linear-to-b from-indigo-500 to-violet-500 rounded-full" />
                                                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('task.subtasks')}</h3>
                                                  <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{subtasks.length}</span>
                                             </div>
                                             <SubtaskList
                                                  storyId={task.id}
                                                  boardId={boardId!}
                                                  columnId={task.column_id || formData.localColumnId || ''}
                                                  subtasks={subtasks}
                                                  onSubtaskOpen={setOpenedSubtaskId}
                                                  onRefresh={() => {
                                                       refetchSubtasks();
                                                       fetchTaskData();
                                                  }}
                                             />
                                        </div>
                                   )}

                                   {/* Subtasks placeholder for new Story */}
                                   {isStory && isNewTask && (
                                        <div className="bg-slate-800/40 rounded-xl border border-indigo-500/20 p-4">
                                             <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                                  <div className="w-1 h-4 bg-linear-to-b from-indigo-500 to-violet-500 rounded-full" />
                                                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('task.subtasks')}</h3>
                                             </div>
                                             <div className="flex items-center gap-3 text-slate-500 py-3">
                                                  <FiLayers className="w-5 h-5 text-indigo-400/50" />
                                                  <p className="text-sm">{t('task.subtasksAvailableAfterSave')}</p>
                                             </div>
                                        </div>
                                   )}

                                   {/* Dates Section */}
                                   <TaskDatesSection startDate={formData.startDate} endDate={formData.endDate} onDateChange={handleDateChange} />

                                   {/* Attachments Section */}
                                   <Suspense fallback={<div className="text-slate-400 text-sm p-4">{t('task.loadingAttachments')}</div>}>
                                        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                             <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                                  <div className="w-1 h-4 bg-linear-to-b from-teal-500 to-green-500 rounded-full" />
                                                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('task.attachments')}</h3>
                                                  <FiPaperclip className="w-3.5 h-3.5 text-slate-500 ml-1" />
                                             </div>
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
                                        </div>
                                   </Suspense>

                                   {!isNewTask && task?.id && <TaskHistory taskId={task.id} columns={columns} onRestore={fetchTaskData} />}

                                   {/* Comments Section */}
                                   {!isNewTask && task?.id && (
                                        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                             <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                                  <div className="w-1 h-4 bg-linear-to-b from-amber-500 to-yellow-500 rounded-full" />
                                                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('task.comments')}</h3>
                                                  <FiMessageCircle className="w-3.5 h-3.5 text-slate-500 ml-1" />
                                                  {task.comments && task.comments.length > 0 && (
                                                       <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">{task.comments.length}</span>
                                                  )}
                                             </div>
                                             <Suspense fallback={<div className="animate-pulse text-slate-400">{t('task.loadingComments')}</div>}>
                                                  <CommentsSection
                                                       taskId={task.id}
                                                       comments={task.comments || []}
                                                       currentUser={user}
                                                       task={task}
                                                       onRefreshComments={fetchTaskData}
                                                       onImagePreview={setPreviewImageUrl}
                                                       teamMembers={teamMembers}
                                                       boardId={boardId}
                                                       boardName={boardData?.title}
                                                       taskTitle={task.title ?? undefined}
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
                                             type: task.type,
                                             parent_id: task.parent_id,
                                        }}
                                        columns={columns}
                                        selectedAssignees={task.collaborators ?? []}
                                        localColumnId={formData.localColumnId}
                                        onRecurringModalOpen={() => setShowRecurringModal(true)}
                                        onOpenTask={onOpenTask}
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

                         {!isStory && (
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
                         )}
                    </motion.div>
                    )}
                    </AnimatePresence>
                    )}
                    </motion.div>

                    {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}

                    {showUnsavedConfirm && (
                         <UnsavedChangesModal
                              isOpen={showUnsavedConfirm}
                              onClose={() => setShowUnsavedConfirm(false)}
                              onConfirmExit={confirmExit}
                              onSaveAndExit={saveAndExit}
                              isSaving={saving || isAutoSaving}
                         />
                    )}

                    {descriptionImages.length > 0 && (
                         <Lightbox
                              images={descriptionImages}
                              currentIndex={descriptionImageIndex}
                              isOpen={descriptionLightboxOpen}
                              onClose={handleDescriptionLightboxClose}
                              onNavigate={handleDescriptionImageNavigate}
                         />
                    )}

                    {openedSubtaskId && (
                         <SingleTaskView
                              taskId={openedSubtaskId}
                              mode="edit"
                              columnId={task?.column_id || formData.localColumnId || ''}
                              boardId={boardId}
                              onClose={() => {
                                   setOpenedSubtaskId(null);
                                   refetchSubtasks();
                              }}
                              onTaskUpdate={() => {
                                   refetchSubtasks();
                                   fetchTaskData();
                              }}
                              columns={columns}
                              statuses={propStatuses}
                              onOpenTask={() => setOpenedSubtaskId(null)}
                         />
                    )}
               </motion.div>
               )}
          </AnimatePresence>
     );
};

export default SingleTaskView;

'use client';

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaLink, FaTimes } from 'react-icons/fa';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { useTaskManagement } from './hooks/useTaskManagement';
import UserSelector from './UserSelector';
import CollaboratorsSelector from './CollaboratorsSelector';
import PrioritySelector from './PrioritySelector';
import { useUpdateTaskCollaboratorsMutation } from '@/app/store/apiSlice';
import { triggerEmailNotification } from '@/app/lib/email/triggerNotification';
import StatusSelector from './StatusSelector';
import CommentsSection from './CommentsSection';
import AttachmentsList from './AttachmentsList';
import ImagePreviewModal from './ImagePreviewModal';
import Button from '../Button/Button';
import Avatar from '../Avatar/Avatar';
import ColumnSelector from '@/app/components/ColumnSelector';
import ActionFooter from './ActionFooter';

import { calculateDuration, copyTaskUrlToClipboard, formatDate, formatFileSize, getAvatarUrl, getFileIcon } from '@/app/utils/helpers';
import { SingleTaskViewProps } from '@/app/types/globalTypes';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';

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
}: SingleTaskViewProps & { columns: { id: string; title: string }[] }) => {
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

     const [updateCollaboratorsMutation] = useUpdateTaskCollaboratorsMutation();

     const [localFilePreviews, setLocalFilePreviews] = useState<LocalFilePreview[]>([]);
     const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
     const [tempTitle, setTempTitle] = useState('');
     const [tempDescription, setTempDescription] = useState('');
     const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
     const [selectedCollaborators, setSelectedCollaborators] = useState<typeof teamMembers>([]);
     const [startDate, setStartDate] = useState<string>('');
     const [endDate, setEndDate] = useState<string>('');
     const [localColumnId, setLocalColumnId] = useState<string | undefined>(columnId);

     const appliedInitialDate = useRef(false);

     useEffect(() => {
          if (task) {
               setTempTitle(task.title || '');
               setTempDescription(task.description || '');
               setSelectedAssigneeId(task.assignee?.id || task.user_id || null);
               setSelectedCollaborators(task.collaborators || []);
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
               if (e.key === 'Escape') onClose();
          };
          document.addEventListener('keydown', onKeyDown);
          return () => document.removeEventListener('keydown', onKeyDown);
     }, [onClose]);

     useOutsideClick([modalRef], onClose);

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

     const handleAssigneeChange = async (assigneeId: string | null) => {
          setSelectedAssigneeId(assigneeId);

          if (!assigneeId) {
               updateTask({ user_id: null, assignee: null });
          } else {
               const member = teamMembers.find((u) => u.id === assigneeId);
               if (member) {
                    updateTask({ user_id: assigneeId, assignee: member });
               }
          }

          if (!isNewTask && currentTaskId) {
               try {
                    await updateTaskMutation({
                         taskId: currentTaskId,
                         data: { user_id: assigneeId },
                    }).unwrap();

                    await fetchTaskData();
                    toast.success('Przypisanie zaktualizowane');
               } catch (error) {
                    console.error('❌ Failed to update assignee:', error);
                    toast.error('Nie udało się zaktualizować przypisania');
               }
          }
     };

     const handleCollaboratorsChange = async (collaboratorIds: string[]) => {
          const prevCollaboratorIds = selectedCollaborators.map((c) => c.id);
          const newCollaborators = teamMembers.filter((u) => collaboratorIds.includes(u.id));
          setSelectedCollaborators(newCollaborators);
          updateTask({ collaborators: newCollaborators });

          if (!isNewTask && currentTaskId && task) {
               try {
                    await updateCollaboratorsMutation({
                         taskId: currentTaskId,
                         collaboratorIds,
                         addedBy: currentUser?.id,
                    }).unwrap();

                    // Send notifications to newly added collaborators
                    const addedIds = collaboratorIds.filter((id) => !prevCollaboratorIds.includes(id));
                    const removedIds = prevCollaboratorIds.filter((id) => !collaboratorIds.includes(id));

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

                    // Send notifications to removed collaborators
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

                    await fetchTaskData();
                    toast.success('Współpracownicy zaktualizowani');
               } catch (error) {
                    console.error('❌ Failed to update collaborators:', error);
                    toast.error('Nie udało się zaktualizować współpracowników');
               }
          }
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

                    // Send notifications for status change
                    if (oldStatusId !== newStatusId) {
                         const oldStatusLabel = task.statuses?.find((s) => s.id === oldStatusId)?.label || 'Nieznany';
                         const newStatusLabel = task.statuses?.find((s) => s.id === newStatusId)?.label || 'Nieznany';

                         // Send to assignee (if different from current user)
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

                         // Send to creator (if different from assignee and current user)
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
                    console.error('❌ Failed to save status:', error);
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

     const fileInputRef = useRef<HTMLInputElement>(null);

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
                    console.log('🔍 Uploading attachments for new task:', currentTaskId);

                    for (const { file, previewUrl } of localFilePreviews) {
                         try {
                              console.log('📤 Uploading file:', file.name);

                              const result = await uploadAttachmentMutation({
                                   file,
                                   taskId: currentTaskId,
                              }).unwrap();

                              console.log('✅ Upload successful:', result);
                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                         } catch (error) {
                              console.error('❌ Upload failed:', error);
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

     const currentStatus = task?.statuses?.find((s) => s.id === task.status_id);

     return (
          <AnimatePresence initial={false}>
               <motion.div
                    ref={overlayRef}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    onClick={(e) => e.target === overlayRef.current && onClose()}
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
                         <div className="flex justify-between items-center px-6 py-3 border-b border-slate-600">
                              <div className="flex items-center gap-3 min-w-0">
                                   {isNewTask ? (
                                        <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">Nowe</span>
                                   ) : task?.id ? (
                                        <span className="bg-slate-700 text-slate-300 text-xs font-mono px-2 py-1 rounded">#{task.id.slice(-6)}</span>
                                   ) : null}
                                   <input
                                        type="text"
                                        className="bg-transparent text-lg font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 truncate min-w-0"
                                        placeholder="Tytuł zadania (wymagany)"
                                        value={tempTitle}
                                        onChange={handleTitleChange}
                                        onKeyDown={handleTitleKeyDown}
                                        autoFocus={isNewTask}
                                   />
                              </div>
                              <div className="flex items-center gap-2">
                                   {!isNewTask && task?.id && <Button variant="ghost" size="sm" icon={<FaLink />} onClick={handleCopyLink} className="text-slate-300 hover:text-white" />}
                                   <Button variant="ghost" size="sm" icon={<FaTimes />} onClick={onClose} className="text-slate-300 hover:text-white" />
                              </div>
                         </div>

                         <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
                                   <div className="block md:hidden mb-4">
                                        <ColumnSelector columns={columns} value={localColumnId} onChange={handleColumnChange} label="Kolumna" />
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <UserSelector
                                             selectedUser={teamMembers.find((u) => u.id === selectedAssigneeId) || null}
                                             availableUsers={teamMembers}
                                             onUserSelect={handleAssigneeChange}
                                             label="Przypisany"
                                        />
                                        <PrioritySelector selectedPriority={task?.priority || null} onChange={(id) => updateTask({ priority: id })} />
                                   </div>

                                   <CollaboratorsSelector
                                        selectedCollaborators={selectedCollaborators}
                                        availableUsers={teamMembers}
                                        onCollaboratorsChange={handleCollaboratorsChange}
                                        assigneeId={selectedAssigneeId}
                                        label="Współpracownicy"
                                   />

                                   <div className="hidden md:block">
                                        <ColumnSelector columns={columns} value={localColumnId} onChange={handleColumnChange} />
                                   </div>
                                   {task?.statuses && task.statuses.length > 0 && (
                                        <div className="mt-6">
                                             <StatusSelector
                                                  statuses={task?.statuses || []}
                                                  selectedStatusId={task?.status_id || null}
                                                  onChange={handleStatusChange}
                                                  onStatusesChange={(newStatuses) => {
                                                       updateTask({ statuses: newStatuses });
                                                  }}
                                                  boardId={boardId}
                                                  disabled={false}
                                                  label="Status"
                                             />{' '}
                                        </div>
                                   )}

                                   <div>
                                        <label className="text-sm text-slate-300">Opis</label>
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
                                             <label className="text-sm flex items-center gap-1 text-slate-300">
                                                  <FaClock className="w-4 h-4" /> Data rozpoczęcia
                                             </label>
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
                                                  onImagePreview={(url) => updateTask({ imagePreview: url })}
                                             />
                                        </div>
                                   )}
                              </div>

                              <aside className="w-full md:w-72 bg-slate-800/70 border-t md:border-t-0 md:border-l border-slate-600 overflow-y-auto p-4 sm:p-6 text-white flex-shrink-0 hidden md:block">
                                   {currentStatus && (
                                        <div className="mb-6">
                                             <h3 className="text-sm text-slate-300 uppercase mb-2">Status</h3>
                                             <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentStatus.color || '#94a3b8' }} />
                                                  <span className="font-medium text-lg">{currentStatus.label}</span>
                                             </div>
                                        </div>
                                   )}

                                   <div className="mb-6">
                                        <h3 className="text-sm text-slate-300 uppercase mb-2">Przypisany</h3>
                                        {task?.assignee ? (
                                             <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                                                  <Avatar src={getAvatarUrl(task.assignee) || ''} alt={task.assignee.name} size={32} className="mr-3 border-2 border-white/20" />
                                                  <div className="flex flex-col min-w-0">
                                                       <span className="text-white font-medium truncate">{task.assignee.name}</span>
                                                       <span className="text-slate-400 text-sm truncate">{task.assignee.email}</span>
                                                  </div>
                                             </div>
                                        ) : (
                                             <div className="text-slate-400">Brak przypisania</div>
                                        )}
                                   </div>

                                   {selectedCollaborators.length > 0 && (
                                        <div className="mb-6">
                                             <h3 className="text-sm text-slate-300 uppercase mb-2">Współpracownicy ({selectedCollaborators.length})</h3>
                                             <div className="space-y-2">
                                                  {selectedCollaborators.map((collaborator) => (
                                                       <div key={collaborator.id} className="flex items-center bg-slate-700 p-2 rounded-lg">
                                                            <Avatar src={getAvatarUrl(collaborator) || ''} alt={collaborator.name} size={24} className="mr-2 border border-white/20" />
                                                            <div className="flex flex-col min-w-0">
                                                                 <span className="text-white text-sm font-medium truncate">{collaborator.name}</span>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>
                                   )}

                                   <div className="mb-6">
                                        <h3 className="text-sm text-slate-300 uppercase mb-2">Autor zadania</h3>
                                        {task?.creator ? (
                                             <div className="flex items-center bg-slate-700 p-3 rounded-lg">
                                                  <Avatar src={getAvatarUrl(task.creator) || ''} alt={task.creator.name} size={32} className="mr-3 border-2 border-white/20" />
                                                  <div className="flex flex-col min-w-0">
                                                       <span className="text-white font-medium truncate">{task.creator.name}</span>
                                                       <span className="text-slate-400 text-sm truncate">{task.creator.email}</span>
                                                  </div>
                                             </div>
                                        ) : (
                                             <div className="text-slate-400">Nieznany</div>
                                        )}
                                   </div>

                                   <div className="mb-6">
                                        <h3 className="text-sm text-slate-300 uppercase mb-2">Utworzono</h3>
                                        <div>{task?.created_at ? formatDate(task.created_at) : '-'}</div>
                                   </div>

                                   <div className="mb-6">
                                        <h3 className="text-sm text-slate-300 uppercase mb-2">Ostatnia aktualizacja</h3>
                                        <div>{task?.updated_at ? formatDate(task.updated_at) : '-'}</div>
                                   </div>

                                   <div className="mb-6">
                                        <h3 className="text-sm text-slate-300 uppercase mb-2">Kolumna</h3>
                                        <div className="text-sm truncate">{columns.find((c) => c.id === localColumnId)?.title || '—'}</div>
                                   </div>

                                   {task?.start_date && task?.end_date && (
                                        <div className="mb-6">
                                             <h4 className="text-sm font-semibold text-slate-300 mt-4 mb-2">Czas trwania</h4>
                                             <p className="text-sm">
                                                  {(() => {
                                                       const dur = calculateDuration(task.start_date, task.end_date);
                                                       return dur !== null ? `${dur} ${dur === 1 ? 'dzień' : 'dni'}` : '-';
                                                  })()}
                                             </p>
                                        </div>
                                   )}
                              </aside>
                         </div>

                         <ActionFooter
                              isNewTask={isNewTask}
                              hasUnsavedChanges={hasUnsavedChanges}
                              isSaving={saving}
                              onSave={handleSave}
                              onClose={onClose}
                              onDelete={isNewTask ? undefined : handleDelete}
                              task={task ?? undefined}
                              tempTitle={tempTitle}
                         />
                    </motion.div>

                    {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
               </motion.div>
          </AnimatePresence>
     );
};

export default SingleTaskView;

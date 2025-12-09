'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
     useGetTaskByIdQuery,
     useUpdateTaskMutation,
     useAddTaskMutation,
     useUploadAttachmentMutation,
     useGetTeamMembersByBoardIdQuery,
     useRemoveTaskMutation,
     useAddNotificationMutation,
     useGetBoardQuery,
     useGetPrioritiesQuery,
} from '@/app/store/apiSlice';
import { TaskDetail, User, Attachment } from '@/app/types/globalTypes';
import { pickUpdatable } from '@/app/utils/helpers';
import { triggerEmailNotification, notifyTaskStakeholders } from '@/app/lib/email/triggerNotification';

export const useTaskManagement = ({
     taskId: propTaskId,
     mode,
     columnId,
     boardId,
     currentUser,
     initialStartDate,
     onTaskUpdate,
     onTaskAdded,
     onClose,
     propStatuses,
}: {
     taskId?: string;
     mode: 'add' | 'edit';
     columnId?: string;
     boardId: string;
     currentUser?: User;
     initialStartDate?: string;
     onTaskUpdate?: (task: TaskDetail) => void;
     onTaskAdded?: (task: TaskDetail) => void;
     onClose: () => void;
     propStatuses?: Array<{ id: string; label: string; color: string }>;
}) => {
     const isNewTask = mode === 'add';
     const [currentTaskId, setCurrentTaskId] = useState<string | null>(isNewTask ? null : propTaskId || null);
     const [task, setTask] = useState<TaskDetail | null>(null);
     const [error, setError] = useState<string | null>(null);
     const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
     const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
     const [addNotification] = useAddNotificationMutation();

     const prevUserId = useRef<string | null | undefined>(null);
     const prevColumnId = useRef<string | null | undefined>(null);
     const prevDueDate = useRef<string | null | undefined>(null);
     const prevPriority = useRef<string | null | undefined>(null);

     // Get board data for email notifications
     const { data: boardData } = useGetBoardQuery(boardId, { skip: !boardId });

     const { data: fetchedTask, error: fetchError, isLoading, refetch: refetchTask } = useGetTaskByIdQuery({ taskId: currentTaskId! }, { skip: !currentTaskId });

     const [updateTaskMutation, { isLoading: saving }] = useUpdateTaskMutation();
     const [addTaskMutation] = useAddTaskMutation();
     const [uploadAttachmentMutation] = useUploadAttachmentMutation();
     const [removeTaskMutation] = useRemoveTaskMutation();

     const { data: teamMembers = [] } = useGetTeamMembersByBoardIdQuery(boardId, {
          skip: !boardId,
     });

     // Cache priorities for email notifications
     const { data: priorities = [] } = useGetPrioritiesQuery();

     const [statuses, setStatuses] = useState<Array<{ id: string; label: string; color: string }>>(propStatuses || []);

     // Fetch statuses from API
     useEffect(() => {
          if (propStatuses && propStatuses.length > 0) {
               setStatuses(propStatuses);
               return;
          }

          if (!boardId) return;

          const fetchStatuses = async () => {
               try {
                    const response = await fetch(`/api/statuses?board_id=${boardId}`);
                    if (response.ok) {
                         const data = await response.json();
                         setStatuses(data);
                    }
               } catch (error) {
                    console.error('❌ Error fetching statuses:', error);
               }
          };

          fetchStatuses();
     }, [boardId, propStatuses]);

     // Load existing task
     useEffect(() => {
          if (isLoading) return;

          if (fetchedTask && statuses.length > 0) {
               const taskWithStatuses = {
                    ...fetchedTask,
                    statuses: statuses,
                    // Set default status if none exists
                    status_id: fetchedTask.status_id || statuses[0]?.id || null,
               };

               setTask(taskWithStatuses);
               setHasUnsavedChanges(false);
               setError(null);
               prevUserId.current = fetchedTask.user_id;
               prevColumnId.current = fetchedTask.column_id;
               prevDueDate.current = fetchedTask.due_date;
               prevPriority.current = fetchedTask.priority;

               if (pendingAttachments.length > 0) {
                    pendingAttachments.forEach(async (file) => {
                         try {
                              if (currentTaskId && currentUser?.id) {
                                   const result = await uploadAttachmentMutation({
                                        file,
                                        taskId: currentTaskId,
                                        userId: currentUser.id,
                                   }).unwrap();
                                   setTask((prev) => {
                                        if (!prev) return prev;
                                        const newList: Attachment[] = prev.attachments ? [...prev.attachments, result] : [result];
                                        return { ...prev, attachments: newList, statuses };
                                   });
                              }
                         } catch {
                              setError('Failed to upload attachment');
                         }
                    });
                    setPendingAttachments([]);
               }
          } else if (!isNewTask && fetchError) {
               setError('Task not found');
          }
     }, [isLoading, fetchedTask, fetchError, pendingAttachments, currentTaskId, currentUser?.id, uploadAttachmentMutation, isNewTask, statuses]);

     useEffect(() => {
          if (isNewTask && statuses.length > 0 && !task) {
               const initialDate = initialStartDate ?? null;
               const pendingStatus = statuses.find((s) => s.label.toLowerCase() === 'oczekujące') || statuses[0];

               const initial: TaskDetail = {
                    id: '',
                    title: '',
                    description: '',
                    column_id: columnId || '',
                    board_id: boardId,
                    priority: null,
                    user_id: currentUser?.id || null,
                    order: 0,
                    completed: false,
                    created_at: undefined,
                    updated_at: undefined,
                    images: undefined,
                    assignee: currentUser
                         ? {
                                id: currentUser.id,
                                name: currentUser.name,
                                email: currentUser.email,
                                image: currentUser.image,
                           }
                         : null,
                    start_date: initialDate,
                    end_date: initialDate,
                    due_date: null,
                    status_id: pendingStatus?.id || null,
                    priority_info: null,
                    attachments: [],
                    comments: [],
                    imagePreview: null,
                    statuses: statuses,
               };

               setTask(initial);
               setHasUnsavedChanges(false);
               setError(null);
               setCurrentTaskId(null);
               setPendingAttachments([]);
               prevUserId.current = null;
          }
     }, [isNewTask, boardId, currentUser, initialStartDate, columnId, statuses, task]);

     useEffect(() => {
          if (isNewTask && columnId) {
               setTask((prev) => {
                    if (!prev) return prev;
                    if (prev.column_id !== columnId) {
                         return { ...prev, column_id: columnId };
                    }
                    return prev;
               });
          }
     }, [isNewTask, columnId]);

     const updateTask = useCallback((changes: Partial<TaskDetail>) => {
          setTask((prev) => {
               if (!prev) return prev;
               const updated = { ...prev, ...changes };
               return updated;
          });
          setHasUnsavedChanges(true);
     }, []);

     const uploadAttachment = useCallback(
          async (file: File) => {
               if (currentTaskId && currentUser?.id) {
                    try {
                         const result = await uploadAttachmentMutation({
                              file,
                              taskId: currentTaskId,
                              userId: currentUser.id,
                         }).unwrap();
                         setTask((prev) => {
                              if (!prev) return prev;
                              const newList: Attachment[] = prev.attachments ? [...prev.attachments, result] : [result];
                              return { ...prev, attachments: newList };
                         });
                         return result;
                    } catch {
                         setError('Failed to upload attachment');
                         return null;
                    }
               } else {
                    setPendingAttachments((prev) => [...prev, file]);
                    return null;
               }
          },
          [currentTaskId, currentUser?.id, uploadAttachmentMutation],
     );

     const saveExistingTask = useCallback(async (): Promise<boolean> => {
          if (!currentTaskId || !task) return false;
          const payload: Partial<TaskDetail> = pickUpdatable(task);
          const prevAssigned = prevUserId.current;
          const prevColumn = prevColumnId.current;
          const prevDue = prevDueDate.current;
          const prevPriorityVal = prevPriority.current;

          try {
               const result = await updateTaskMutation({
                    taskId: currentTaskId,
                    data: payload,
               }).unwrap();

               const boardName = boardData?.title;

               // Send notifications for assignment change
               if (result.user_id && result.user_id !== prevAssigned) {
                    await addNotification({
                         user_id: result.user_id,
                         type: 'task_assigned',
                         task_id: result.id,
                         board_id: result.board_id,
                         message: `You've been assigned to "${result.title}"`,
                    });

                    // Send email notification
                    triggerEmailNotification({
                         type: 'task_assigned',
                         taskId: result.id,
                         taskTitle: result.title,
                         boardId: result.board_id,
                         boardName,
                         recipientId: result.user_id,
                         metadata: { assignerName: currentUser?.name || 'Someone' },
                    });
               }

               // Send email notification to previously assigned user when unassigned
               if (prevAssigned && prevAssigned !== result.user_id && prevAssigned !== currentUser?.id) {
                    triggerEmailNotification({
                         type: 'task_unassigned',
                         taskId: result.id,
                         taskTitle: result.title,
                         boardId: result.board_id,
                         boardName,
                         recipientId: prevAssigned,
                         metadata: { unassignerName: currentUser?.name || 'Someone' },
                    });
               }

               // Send email for status/column change
               if (result.column_id && result.column_id !== prevColumn) {
                    const oldColumnName = boardData?.columns?.find((c) => c.id === prevColumn)?.title || 'Unknown';
                    const newColumnName = boardData?.columns?.find((c) => c.id === result.column_id)?.title || 'Unknown';

                    notifyTaskStakeholders(
                         {
                              type: 'status_changed',
                              taskId: result.id,
                              taskTitle: result.title,
                              boardId: result.board_id,
                              boardName,
                              metadata: { oldStatus: oldColumnName, newStatus: newColumnName },
                         },
                         { assigneeId: result.user_id, creatorId: task.created_by, currentUserId: currentUser?.id }
                    );
               }

               // Send email for due date change
               if (result.due_date !== prevDue) {
                    notifyTaskStakeholders(
                         {
                              type: 'due_date_changed',
                              taskId: result.id,
                              taskTitle: result.title,
                              boardId: result.board_id,
                              boardName,
                              metadata: { newDueDate: result.due_date || 'Removed' },
                         },
                         { assigneeId: result.user_id, creatorId: task.created_by, currentUserId: currentUser?.id }
                    );
               }

               // Notify creator about assignment changes (if creator is different from current user and assignees)
               if (result.user_id !== prevAssigned && task.created_by && task.created_by !== currentUser?.id) {
                    // Don't send if creator is the new assignee or the previous assignee (they get their own notifications)
                    if (task.created_by !== result.user_id && task.created_by !== prevAssigned) {
                         const assigneeName = teamMembers.find((m) => m.id === result.user_id)?.name;
                         const assignerName = currentUser?.name || 'Ktoś';

                         triggerEmailNotification({
                              type: 'task_assigned',
                              taskId: result.id,
                              taskTitle: result.title,
                              boardId: result.board_id,
                              boardName,
                              recipientId: task.created_by,
                              metadata: {
                                   assignerName: assigneeName
                                        ? `${assignerName} przypisał/a: ${assigneeName}`
                                        : `${assignerName} usunął/ęła przypisanie`
                              },
                         });
                    }
               }

               // Send email for priority change (using cached priorities)
               if (result.priority !== prevPriorityVal) {
                    const oldPriorityLabel = priorities.find((p) => p.id === prevPriorityVal)?.label || 'Brak';
                    const newPriorityLabel = priorities.find((p) => p.id === result.priority)?.label || 'Brak';

                    notifyTaskStakeholders(
                         {
                              type: 'priority_changed',
                              taskId: result.id,
                              taskTitle: result.title,
                              boardId: result.board_id,
                              boardName,
                              metadata: { oldPriority: oldPriorityLabel, newPriority: newPriorityLabel },
                         },
                         { assigneeId: result.user_id, creatorId: task.created_by, currentUserId: currentUser?.id }
                    );
               }

               prevUserId.current = result.user_id;
               prevColumnId.current = result.column_id;
               prevDueDate.current = result.due_date;
               prevPriority.current = result.priority;
               setHasUnsavedChanges(false);
               onTaskUpdate?.(result);
               return true;
          } catch (err) {
               console.error('❌ Failed to update task:', err);
               setError('Failed to update task');
               return false;
          }
     }, [currentTaskId, task, updateTaskMutation, onTaskUpdate, addNotification, boardData, currentUser, priorities, teamMembers]);

     const saveNewTask = useCallback(async (): Promise<boolean> => {
          if (!task || !columnId) return false;
          const payload: Partial<TaskDetail> & { column_id: string } = {
               column_id: columnId,
               title: task.title,
               description: task.description,
               board_id: boardId,
               priority: task.priority ?? null,
               user_id: task.user_id ?? null,
               created_by: currentUser?.id ?? null,
               start_date: task.start_date ?? null,
               end_date: task.end_date ?? null,
               due_date: task.due_date ?? null,
               status_id: task.status_id ?? null,
          };

          try {
               const result = await addTaskMutation(payload).unwrap();
               setCurrentTaskId(result.id);
               setHasUnsavedChanges(false);
               setTask((prev) => {
                    if (!prev) return prev;
                    return {
                         ...prev,
                         id: result.id,
                         created_at: result.created_at ?? prev.created_at,
                         updated_at: result.updated_at ?? prev.updated_at,
                    };
               });

               if (result.user_id) {
                    await addNotification({
                         user_id: result.user_id,
                         type: 'task_assigned',
                         task_id: result.id,
                         board_id: result.board_id,
                         message: `You've been assigned to "${result.title}"`,
                    });

                    // Send email notification for new task assignment
                    triggerEmailNotification({
                         type: 'task_assigned',
                         taskId: result.id,
                         taskTitle: result.title,
                         boardId: result.board_id,
                         boardName: boardData?.title,
                         recipientId: result.user_id,
                         metadata: { assignerName: currentUser?.name || 'Someone' },
                    });
               }

               onTaskAdded?.({
                    ...task,
                    id: result.id,
                    column_id: columnId,
                    board_id: boardId,
                    created_at: result.created_at ?? undefined,
                    updated_at: result.updated_at ?? undefined,
               });
               return true;
          } catch (err) {
               console.error('❌ Failed to create task:', err);
               setError('Failed to create task');
               return false;
          }
     }, [task, columnId, boardId, addTaskMutation, onTaskAdded, addNotification, boardData, currentUser]);

     const deleteTask = useCallback(async () => {
          if (!currentTaskId || !task) return;
          const effectiveColumnId = columnId || task.column_id;
          if (!effectiveColumnId) {
               setError('Cannot delete: missing column information');
               return;
          }
          try {
               await removeTaskMutation({
                    taskId: currentTaskId,
                    columnId: effectiveColumnId,
               }).unwrap();
               onClose();
          } catch {
               setError('Failed to delete task');
          }
     }, [currentTaskId, task, columnId, removeTaskMutation, onClose]);

     const fetchTaskData = useCallback(async () => {
          if (currentTaskId) {
               try {
                    const { data } = await refetchTask();
                    if (data && statuses.length > 0) {
                         setTask({
                              ...data,
                              statuses: statuses,
                              status_id: data.status_id || statuses[0]?.id || null,
                         });
                         setHasUnsavedChanges(false);
                    }
               } catch (err) {
                    console.error('❌ Failed to refetch task:', err);
               }
          }
     }, [currentTaskId, refetchTask, statuses]);

     return {
          task,
          loading: isLoading,
          saving,
          error,
          hasUnsavedChanges,
          isNewTask,
          updateTask,
          saveNewTask,
          saveExistingTask,
          deleteTask,
          fetchTaskData,
          uploadAttachment,
          teamMembers,
          fetchedTask,
          updateTaskMutation,
          currentTaskId,
     };
};

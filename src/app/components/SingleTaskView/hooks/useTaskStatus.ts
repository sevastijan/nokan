// hooks/useTaskStatus.ts
'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { Status, TaskDetail } from '@/app/types/globalTypes';

interface UseTaskStatusProps {
     isNewTask: boolean;
     currentTaskId: string | null;
     task: TaskDetail | null;
     currentUserId?: string;
     boardId: string;
     updateTask: (updates: Partial<TaskDetail>) => void;
     updateTaskMutation: (params: { taskId: string; data: { status_id: string } }) => {
          unwrap(): Promise<unknown>;
     };
     fetchTaskData: () => Promise<void>;
}

export const useTaskStatus = ({ isNewTask, currentTaskId, task, currentUserId, boardId, updateTask, updateTaskMutation, fetchTaskData }: UseTaskStatusProps) => {
     const handleStatusChange = useCallback(
          async (newStatusId: string) => {
               if (!task) return;

               const oldStatusId = task.status_id;

               updateTask({ status_id: newStatusId });

               if (!isNewTask && currentTaskId) {
                    try {
                         await updateTaskMutation({
                              taskId: currentTaskId,
                              data: { status_id: newStatusId },
                         }).unwrap();

                         await fetchTaskData();

                         if (oldStatusId !== newStatusId) {
                              const oldStatusLabel = task.statuses?.find((s: Status) => s.id === oldStatusId)?.label || 'Nieznany';
                              const newStatusLabel = task.statuses?.find((s: Status) => s.id === newStatusId)?.label || 'Nieznany';

                              if (task.user_id && task.user_id !== currentUserId && boardId) {
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

                              if (task.created_by && task.created_by !== currentUserId && task.created_by !== task.user_id && boardId) {
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
          },
          [isNewTask, currentTaskId, task, currentUserId, boardId, updateTask, updateTaskMutation, fetchTaskData],
     );

     return { handleStatusChange };
};

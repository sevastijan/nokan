'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { triggerEmailNotification } from '@/app/lib/email/triggerNotification';
import { useUpdateTaskCollaboratorsMutation } from '@/app/store/apiSlice';
import { User, TaskDetail } from '@/app/types/globalTypes';

interface UseTaskAssigneesProps {
     isNewTask: boolean;
     currentTaskId: string | null;
     boardId: string;
     currentUserId?: string;
     currentUserName?: string | null;
     taskTitle?: string | null;
     fetchTaskData: () => Promise<void>;
     updateTask: (updates: Partial<TaskDetail>) => void;
     teamMembers: User[];
     selectedAssignees: User[];
     setSelectedAssignees: (assignees: User[]) => void;
}

export const useTaskAssignees = ({
     isNewTask,
     currentTaskId,
     boardId,
     currentUserId,
     currentUserName,
     taskTitle,
     fetchTaskData,
     updateTask,
     teamMembers,
     selectedAssignees,
     setSelectedAssignees,
}: UseTaskAssigneesProps) => {
     const [updateCollaboratorsMutation] = useUpdateTaskCollaboratorsMutation();

     const handleAssigneesChange = useCallback(
          async (userIds: string[]) => {
               const prevAssigneeIds = selectedAssignees.map((a) => a.id);
               const newAssignees = teamMembers.filter((u) => userIds.includes(u.id));
               setSelectedAssignees(newAssignees);
               updateTask({ collaborators: newAssignees });

               if (!isNewTask && currentTaskId) {
                    try {
                         await updateCollaboratorsMutation({
                              taskId: currentTaskId,
                              collaboratorIds: userIds,
                              boardId,
                         }).unwrap();

                         await fetchTaskData();

                         const addedIds = userIds.filter((id) => !prevAssigneeIds.includes(id));
                         const removedIds = prevAssigneeIds.filter((id) => !userIds.includes(id));

                         for (const addedId of addedIds) {
                              if (addedId !== currentUserId) {
                                   triggerEmailNotification({
                                        type: 'collaborator_added',
                                        taskId: currentTaskId,
                                        taskTitle: taskTitle || 'Task',
                                        boardId,
                                        recipientId: addedId,
                                        metadata: { adderName: currentUserName || 'Ktoś' },
                                   });
                              }
                         }

                         for (const removedId of removedIds) {
                              if (removedId !== currentUserId) {
                                   triggerEmailNotification({
                                        type: 'collaborator_removed',
                                        taskId: currentTaskId,
                                        taskTitle: taskTitle || 'Task',
                                        boardId,
                                        recipientId: removedId,
                                        metadata: { removerName: currentUserName || 'Ktoś' },
                                   });
                              }
                         }

                         toast.success('Przypisani zaktualizowani');
                    } catch (error) {
                         console.error('Failed to update assignees:', error);
                         toast.error('Nie udało się zaktualizować przypisanych');
                    }
               }
          },
          [isNewTask, currentTaskId, boardId, currentUserId, currentUserName, taskTitle, fetchTaskData, updateTask, teamMembers, selectedAssignees, setSelectedAssignees, updateCollaboratorsMutation],
     );

     return { handleAssigneesChange };
};

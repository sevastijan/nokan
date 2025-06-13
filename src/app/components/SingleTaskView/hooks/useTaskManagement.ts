import { useEffect, useState, useCallback } from "react";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useAddTaskMutation,
  useUploadAttachmentMutation,
  useGetTeamMembersByBoardIdQuery,
} from "@/app/store/apiSlice";
import { TaskDetail, User } from "@/app/types/globalTypes";
import { UpdatableTask, pickUpdatable } from "@/app/utils/helpers";

export const useTaskManagement = ({
  taskId,
  mode,
  columnId,
  boardId,
  currentUser,
  onTaskUpdate,
  onTaskAdded,
  onClose,
}: {
  taskId?: string;
  mode: "add" | "edit";
  columnId?: string;
  boardId: string;
  currentUser?: User;
  onTaskUpdate?: (task: TaskDetail) => void;
  onTaskAdded?: (task: TaskDetail) => void;
  onClose: () => void;
}) => {
  const isNewTask = mode === "add";

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    data: fetchedTask,
    error: fetchError,
    isLoading,
  } = useGetTaskByIdQuery({ taskId: taskId! }, { skip: !taskId || isNewTask });

  const [updateTaskMutation, { isLoading: saving }] = useUpdateTaskMutation();
  const [addTaskMutation] = useAddTaskMutation();
  const [uploadAttachmentMutation] = useUploadAttachmentMutation();

  // Załadowanie taska
  useEffect(() => {
    if (isLoading) return;

    if (fetchedTask) {
      setTask(fetchedTask);
      setError(null);
    } else if (fetchError) {
      setError("Task not found");
    }
  }, [fetchedTask, fetchError, isLoading]);

  // Lokalna edycja pól i oznaczenie zmian
  const updateTask = useCallback(
    (changes: Partial<TaskDetail>) => {
      if (!task) return;
      setTask({ ...task, ...changes });
      setHasUnsavedChanges(true);
    },
    [task]
  );

  // Pobranie członków zespołu
  const {
    data: teamMembers = [],
    isLoading: loadingTeamMembers,
    error: teamError,
  } = useGetTeamMembersByBoardIdQuery(boardId, { skip: !boardId });

  // Upload attachmentów
  const uploadAttachment = useCallback(
    async (file: File) => {
      if (!task?.id || !currentUser?.id) return null;
      try {
        const result = await uploadAttachmentMutation({
          file,
          taskId: task.id,
          userId: currentUser.id,
        }).unwrap();
        return result;
      } catch (err) {
        setError("Failed to upload attachment");
        return null;
      }
    },
    [uploadAttachmentMutation, task?.id, currentUser?.id]
  );

  // Zapis istniejącego taska – tylko dozwolone pola
  const saveExistingTask = useCallback(async () => {
    if (!taskId || !task) return false;

    // 1) wybieramy jedynie kolumny które są w tabeli tasks
    const payload: UpdatableTask = pickUpdatable(task);

    try {
      const result = await updateTaskMutation({
        taskId,
        data: payload,
      }).unwrap();

      setHasUnsavedChanges(false);
      onTaskUpdate?.(result);
      return true;
    } catch (err) {
      setError("Failed to update task");
      return false;
    }
  }, [taskId, task, updateTaskMutation, onTaskUpdate]);

  // Zapis nowego taska
  const saveNewTask = useCallback(async () => {
    if (!task || !columnId) return false;
    try {
      const result = await addTaskMutation({
        ...task,
        column_id: columnId,
      }).unwrap();

      setHasUnsavedChanges(false);
      onTaskAdded?.(result);
      return true;
    } catch (err) {
      setError("Failed to create task");
      return false;
    }
  }, [task, columnId, addTaskMutation, onTaskAdded]);

  const deleteTask = useCallback(() => {
    // implement if needed
  }, []);

  // (opcjonalnie) fetch ponowny taska
  const fetchTaskData = useCallback(() => {}, []);

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
  };
};

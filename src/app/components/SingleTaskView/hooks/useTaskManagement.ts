// src/app/components/SingleTaskView/hooks/useTaskManagement.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useAddTaskMutation,
  useUploadAttachmentMutation,
  useGetTeamMembersByBoardIdQuery,
  useRemoveTaskMutation,
} from "@/app/store/apiSlice";
import { TaskDetail, User, Attachment } from "@/app/types/globalTypes";
import { pickUpdatable } from "@/app/utils/helpers";

/**
 * Hook to manage a single task: fetch (edit mode), lokalne zmiany, zapisz (nowe lub istniejące), upload załączników, delete.
 */
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

  // Stan lokalny: edytowany/nowy task
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch istniejącego task w trybie edycji
  const {
    data: fetchedTask,
    error: fetchError,
    isLoading,
    refetch: refetchTask,
  } = useGetTaskByIdQuery({ taskId: taskId! }, { skip: !taskId || isNewTask });

  // Mutations
  const [updateTaskMutation, { isLoading: saving }] = useUpdateTaskMutation();
  const [addTaskMutation] = useAddTaskMutation();
  const [uploadAttachmentMutation] = useUploadAttachmentMutation();
  const [removeTaskMutation] = useRemoveTaskMutation();

  // Team members do selecta
  const {
    data: teamMembers = [],
    isLoading: loadingTeamMembers,
    error: teamError,
  } = useGetTeamMembersByBoardIdQuery(boardId, { skip: !boardId });

  // 1) Gdy w trybie edycji i przychodzi fetchedTask, inicjalizuj lokalny stan
  useEffect(() => {
    if (isLoading) return;
    if (!isNewTask) {
      if (fetchedTask) {
        setTask(fetchedTask);
        setHasUnsavedChanges(false);
        setError(null);
      } else if (fetchError) {
        setError("Task not found");
      }
    }
  }, [isLoading, fetchedTask, fetchError, isNewTask]);

  // 2) W trybie dodawania, ustaw pusty TaskDetail
  useEffect(() => {
    if (isNewTask) {
      const initial: TaskDetail = {
        id: "", // w backendzie wygenerowane
        title: "",
        description: "",
        column_id: columnId || "",
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
        start_date: null,
        end_date: null,
        due_date: null,
        status: null,
        priority_info: null,
        attachments: [],
        comments: [],
        imagePreview: null,
      };
      setTask(initial);
      setHasUnsavedChanges(false);
      setError(null);
    }
  }, [isNewTask, boardId, columnId, currentUser]);

  /**
   * Lokalna aktualizacja pola task. Oznacza unsaved changes.
   */
  const updateTask = useCallback((changes: Partial<TaskDetail>) => {
    setTask((prev) => {
      if (!prev) return prev;
      return { ...prev, ...changes };
    });
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Upload pojedynczego załącznika.
   * Po sukcesie dodaje do lokalnej listy attachments.
   */
  const uploadAttachment = useCallback(
    async (file: File) => {
      if (!task?.id || !currentUser?.id) return null;
      try {
        const result = await uploadAttachmentMutation({
          file,
          taskId: task.id,
          userId: currentUser.id,
        }).unwrap();
        // Dodaj do lokalnych attachments
        setTask((prev) => {
          if (!prev) return prev;
          const newList: Attachment[] = prev.attachments
            ? [...prev.attachments, result]
            : [result];
          return { ...prev, attachments: newList };
        });
        // Nie ustawiamy unsavedChanges, bo upload jest osobny request
        return result;
      } catch (err) {
        console.error("Upload attachment error:", err);
        setError("Failed to upload attachment");
        return null;
      }
    },
    [uploadAttachmentMutation, task?.id, currentUser?.id]
  );

  /**
   * Zapis istniejącego task.
   * Bierze pickUpdatable(task) i wysyła. Po sukcesie resetuje hasUnsavedChanges.
   */
  const saveExistingTask = useCallback(async (): Promise<boolean> => {
    if (!taskId || !task) return false;
    const payload: Partial<TaskDetail> = pickUpdatable(task);
    try {
      const result = await updateTaskMutation({
        taskId,
        data: payload,
      }).unwrap();
      setHasUnsavedChanges(false);
      onTaskUpdate?.(result);
      return true;
    } catch (err) {
      console.error("Failed to update task:", err);
      setError("Failed to update task");
      return false;
    }
  }, [taskId, task, updateTaskMutation, onTaskUpdate]);

  /**
   * Zapis nowego task.
   * Explicitnie wybiera pola do insertu.
   */
  const saveNewTask = useCallback(async (): Promise<boolean> => {
    if (!task || !columnId) return false;
    // Przygotuj payload: unikaj niepotrzebnych pól
    const payload: Partial<TaskDetail> & { column_id: string } = {
      column_id: columnId,
      title: task.title,
      description: task.description,
      board_id: boardId,
      priority: task.priority ?? null,
      user_id: task.user_id ?? null,
      start_date: task.start_date ?? null,
      end_date: task.end_date ?? null,
      // inne pola jeśli potrzebne: due_date, status itp.
    };
    try {
      const result = await addTaskMutation(payload).unwrap();
      setHasUnsavedChanges(false);
      onTaskAdded?.(result);
      return true;
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Failed to create task");
      return false;
    }
  }, [task, columnId, boardId, addTaskMutation, onTaskAdded]);

  /**
   * Delete task (tylko w edit mode). Po sukcesie zamyka modal.
   */
  const deleteTask = useCallback(async () => {
    if (!taskId || !columnId) return;
    try {
      await removeTaskMutation({ taskId, columnId }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task");
    }
  }, [taskId, columnId, removeTaskMutation, onClose]);

  /**
   * Refetch task z serwera, nadpisuje lokalny stan.
   */
  const fetchTaskData = useCallback(async () => {
    if (taskId) {
      try {
        const { data } = await refetchTask();
        if (data) {
          setTask(data);
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error("Failed to refetch task:", err);
      }
    }
  }, [taskId, refetchTask]);

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

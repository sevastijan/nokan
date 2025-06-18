// src/app/hooks/useTaskManagement.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useAddTaskMutation,
  useUploadAttachmentMutation,
  useGetTeamMembersByBoardIdQuery,
  useRemoveTaskMutation,
  useAddNotificationMutation,
} from "@/app/store/apiSlice";
import { TaskDetail, User, Attachment } from "@/app/types/globalTypes";
import { pickUpdatable } from "@/app/utils/helpers";

/**
 * Custom hook for task creation/editing logic, with attachments and notification support.
 * Accepts initialStartDate for calendar integration. Includes debug logs.
 */
export const useTaskManagement = ({
  taskId: propTaskId,
  mode,
  columnId,
  boardId,
  currentUser,
  initialStartDate, // optional initial date for new task
  onTaskUpdate,
  onTaskAdded,
  onClose,
}: {
  taskId?: string;
  mode: "add" | "edit";
  columnId?: string;
  boardId: string;
  currentUser?: User;
  initialStartDate?: string;
  onTaskUpdate?: (task: TaskDetail) => void;
  onTaskAdded?: (task: TaskDetail) => void;
  onClose: () => void;
}) => {
  const isNewTask = mode === "add";
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(
    isNewTask ? null : propTaskId || null
  );
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [addNotification] = useAddNotificationMutation();

  // Used to detect assignment change on edit
  const prevUserId = useRef<string | null | undefined>(null);

  // Fetch the task for edit mode (or after creation)
  const {
    data: fetchedTask,
    error: fetchError,
    isLoading,
    refetch: refetchTask,
  } = useGetTaskByIdQuery({ taskId: currentTaskId! }, { skip: !currentTaskId });

  // Mutations
  const [updateTaskMutation, { isLoading: saving }] = useUpdateTaskMutation();
  const [addTaskMutation] = useAddTaskMutation();
  const [uploadAttachmentMutation] = useUploadAttachmentMutation();
  const [removeTaskMutation] = useRemoveTaskMutation();

  // Fetch team members for board (assignee selection)
  const { data: teamMembers = [] } = useGetTeamMembersByBoardIdQuery(boardId, {
    skip: !boardId,
  });

  // Debug: log initial params
  useEffect(() => {
    console.log(
      "[useTaskManagement] mode:",
      mode,
      "propTaskId:",
      propTaskId,
      "initialStartDate:",
      initialStartDate
    );
  }, [mode, propTaskId, initialStartDate]);

  // When the task is fetched (edit mode), sync state and handle pending attachments
  useEffect(() => {
    console.log(
      "[useTaskManagement] fetchEffect isLoading:",
      isLoading,
      "fetchedTask:",
      fetchedTask,
      "fetchError:",
      fetchError
    );
    if (isLoading) return;
    if (fetchedTask) {
      setTask(fetchedTask);
      setHasUnsavedChanges(false);
      setError(null);
      prevUserId.current = fetchedTask.user_id;
      console.log("[useTaskManagement] set fetched task:", fetchedTask);
      if (pendingAttachments.length > 0) {
        pendingAttachments.forEach(async (file) => {
          try {
            if (currentTaskId && currentUser?.id) {
              const result = await uploadAttachmentMutation({
                file,
                taskId: currentTaskId,
                userId: currentUser.id,
              }).unwrap();
              console.log("[useTaskManagement] uploaded attachment:", result);
              setTask((prev) => {
                if (!prev) return prev;
                const newList: Attachment[] = prev.attachments
                  ? [...prev.attachments, result]
                  : [result];
                return { ...prev, attachments: newList };
              });
            }
          } catch (err) {
            setError("Failed to upload attachment");
          }
        });
        setPendingAttachments([]);
      }
    } else if (!isNewTask && fetchError) {
      setError("Task not found");
      console.warn("[useTaskManagement] Task not found for id", currentTaskId);
    }
  }, [
    isLoading,
    fetchedTask,
    fetchError,
    pendingAttachments,
    currentTaskId,
    currentUser?.id,
    uploadAttachmentMutation,
    isNewTask,
  ]);

  // On add mode: set up an empty task template, using initialStartDate if provided
  useEffect(() => {
    if (isNewTask) {
      const initialDate = initialStartDate ?? null;
      console.log(
        "[useTaskManagement] initializing new task with date",
        initialDate
      );
      const initial: TaskDetail = {
        id: "",
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
        start_date: initialDate,
        end_date: initialDate,
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
      setCurrentTaskId(null);
      setPendingAttachments([]);
      prevUserId.current = null;
    }
  }, [isNewTask, boardId, columnId, currentUser, initialStartDate]);

  // Local update of task state
  const updateTask = useCallback((changes: Partial<TaskDetail>) => {
    console.log("[useTaskManagement] updateTask changes:", changes);
    setTask((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...changes };
      console.log("[useTaskManagement] updated task state:", updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Add an attachment (for both new and existing tasks)
  const uploadAttachment = useCallback(
    async (file: File) => {
      console.log("[useTaskManagement] uploadAttachment file:", file);
      if (currentTaskId && currentUser?.id) {
        try {
          const result = await uploadAttachmentMutation({
            file,
            taskId: currentTaskId,
            userId: currentUser.id,
          }).unwrap();
          console.log("[useTaskManagement] attachment uploaded:", result);
          setTask((prev) => {
            if (!prev) return prev;
            const newList: Attachment[] = prev.attachments
              ? [...prev.attachments, result]
              : [result];
            return { ...prev, attachments: newList };
          });
          return result;
        } catch (err) {
          setError("Failed to upload attachment");
          console.error(err);
          return null;
        }
      } else {
        setPendingAttachments((prev) => [...prev, file]);
        return null;
      }
    },
    [currentTaskId, currentUser?.id, uploadAttachmentMutation]
  );

  // Save updates to an existing task (edit mode)
  const saveExistingTask = useCallback(async (): Promise<boolean> => {
    console.log("[useTaskManagement] saveExistingTask, task:", task);
    if (!currentTaskId || !task) return false;
    const payload: Partial<TaskDetail> = pickUpdatable(task);
    console.log("[useTaskManagement] saveExistingTask payload:", payload);
    const prevAssigned = prevUserId.current;
    try {
      const result = await updateTaskMutation({
        taskId: currentTaskId,
        data: payload,
      }).unwrap();
      console.log("[useTaskManagement] saveExistingTask result:", result);
      if (result.user_id && result.user_id !== prevAssigned) {
        await addNotification({
          user_id: result.user_id,
          type: "task_assigned",
          task_id: result.id,
          board_id: result.board_id,
          message: `You've been assigned to "${result.title}"`,
        });
      }
      prevUserId.current = result.user_id;
      setHasUnsavedChanges(false);
      onTaskUpdate?.(result);
      return true;
    } catch (err) {
      console.error(err);
      setError("Failed to update task");
      return false;
    }
  }, [currentTaskId, task, updateTaskMutation, onTaskUpdate, addNotification]);

  // Save a new task (add mode)
  const saveNewTask = useCallback(async (): Promise<boolean> => {
    console.log("[useTaskManagement] saveNewTask, task:", task);
    if (!task || !columnId) return false;
    const payload: Partial<TaskDetail> & { column_id: string } = {
      column_id: columnId,
      title: task.title,
      description: task.description,
      board_id: boardId,
      priority: task.priority ?? null,
      user_id: task.user_id ?? null,
      start_date: task.start_date ?? null,
      end_date: task.end_date ?? null,
      due_date: task.due_date ?? null,
      status: task.status ?? null,
    };
    console.log("[useTaskManagement] saveNewTask payload:", payload);
    try {
      const result = await addTaskMutation(payload).unwrap();
      console.log("[useTaskManagement] saveNewTask result:", result);
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
          type: "task_assigned",
          task_id: result.id,
          board_id: result.board_id,
          message: `You've been assigned to "${result.title}"`,
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
      console.error(err);
      setError("Failed to create task");
      return false;
    }
  }, [task, columnId, boardId, addTaskMutation, onTaskAdded, addNotification]);

  // Remove the task
  const deleteTask = useCallback(async () => {
    console.log("[useTaskManagement] deleteTask, id:", currentTaskId);
    if (!currentTaskId || !task) return;
    const effectiveColumnId = columnId || task.column_id;
    if (!effectiveColumnId) {
      setError("Cannot delete: missing column information");
      return;
    }
    try {
      await removeTaskMutation({
        taskId: currentTaskId,
        columnId: effectiveColumnId,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to delete task");
    }
  }, [currentTaskId, task, columnId, removeTaskMutation, onClose]);

  // Refetch the task data (edit mode)
  const fetchTaskData = useCallback(async () => {
    console.log("[useTaskManagement] fetchTaskData for id:", currentTaskId);
    if (currentTaskId) {
      try {
        const { data } = await refetchTask();
        if (data) {
          console.log("[useTaskManagement] refetched task:", data);
          setTask(data);
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [currentTaskId, refetchTask]);

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

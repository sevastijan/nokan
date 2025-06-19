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
 * Custom hook for creating/editing a task, including attachments and notifications.
 * Synchronizes initial columnId and start date when provided.
 */
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

  const prevUserId = useRef<string | null | undefined>(null);

  const {
    data: fetchedTask,
    error: fetchError,
    isLoading,
    refetch: refetchTask,
  } = useGetTaskByIdQuery({ taskId: currentTaskId! }, { skip: !currentTaskId });

  const [updateTaskMutation, { isLoading: saving }] = useUpdateTaskMutation();
  const [addTaskMutation] = useAddTaskMutation();
  const [uploadAttachmentMutation] = useUploadAttachmentMutation();
  const [removeTaskMutation] = useRemoveTaskMutation();

  const { data: teamMembers = [] } = useGetTeamMembersByBoardIdQuery(boardId, {
    skip: !boardId,
  });

  useEffect(() => {
    if (isLoading) return;
    if (fetchedTask) {
      setTask(fetchedTask);
      setHasUnsavedChanges(false);
      setError(null);
      prevUserId.current = fetchedTask.user_id;
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
                const newList: Attachment[] = prev.attachments
                  ? [...prev.attachments, result]
                  : [result];
                return { ...prev, attachments: newList };
              });
            }
          } catch {
            setError("Failed to upload attachment");
          }
        });
        setPendingAttachments([]);
      }
    } else if (!isNewTask && fetchError) {
      setError("Task not found");
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

  useEffect(() => {
    if (isNewTask) {
      const initialDate = initialStartDate ?? null;
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
  }, [isNewTask, boardId, currentUser, initialStartDate, columnId]);

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
      return { ...prev, ...changes };
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
            const newList: Attachment[] = prev.attachments
              ? [...prev.attachments, result]
              : [result];
            return { ...prev, attachments: newList };
          });
          return result;
        } catch {
          setError("Failed to upload attachment");
          return null;
        }
      } else {
        setPendingAttachments((prev) => [...prev, file]);
        return null;
      }
    },
    [currentTaskId, currentUser?.id, uploadAttachmentMutation]
  );

  const saveExistingTask = useCallback(async (): Promise<boolean> => {
    if (!currentTaskId || !task) return false;
    const payload: Partial<TaskDetail> = pickUpdatable(task);
    const prevAssigned = prevUserId.current;
    try {
      const result = await updateTaskMutation({
        taskId: currentTaskId,
        data: payload,
      }).unwrap();
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
    } catch {
      setError("Failed to update task");
      return false;
    }
  }, [currentTaskId, task, updateTaskMutation, onTaskUpdate, addNotification]);

  const saveNewTask = useCallback(async (): Promise<boolean> => {
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
    } catch {
      setError("Failed to create task");
      return false;
    }
  }, [task, columnId, boardId, addTaskMutation, onTaskAdded, addNotification]);

  const deleteTask = useCallback(async () => {
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
    } catch {
      setError("Failed to delete task");
    }
  }, [currentTaskId, task, columnId, removeTaskMutation, onClose]);

  const fetchTaskData = useCallback(async () => {
    if (currentTaskId) {
      try {
        const { data } = await refetchTask();
        if (data) {
          setTask(data);
          setHasUnsavedChanges(false);
        }
      } catch {
        // ignore
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

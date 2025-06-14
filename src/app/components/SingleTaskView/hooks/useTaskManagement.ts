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

export const useTaskManagement = ({
  taskId: propTaskId,
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

  // Track the “current” task ID: in edit mode starts as propTaskId; in add mode, null until creation
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(
    isNewTask ? null : propTaskId || null
  );

  // Local task state
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Pending attachments for Add Mode: files selected before creation
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);

  // Fetch existing task in edit mode or after creation: skip if no currentTaskId
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

  // Team members for assignee select
  const {
    data: teamMembers = [],
    isLoading: loadingTeamMembers,
    error: teamError,
  } = useGetTeamMembersByBoardIdQuery(boardId, { skip: !boardId });

  // 1) Initialize local state when fetchedTask arrives (edit mode or after creation)
  useEffect(() => {
    if (isLoading) return;
    if (fetchedTask) {
      setTask(fetchedTask);
      setHasUnsavedChanges(false);
      setError(null);

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
          } catch (err) {
            console.error("Upload attachment error:", err);
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

  // 2) Initialize local state for Add Mode
  useEffect(() => {
    if (isNewTask) {
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
      setCurrentTaskId(null);
      setPendingAttachments([]);
    }
  }, [isNewTask, boardId, columnId, currentUser]);

  // 3) Local updateTask
  const updateTask = useCallback((changes: Partial<TaskDetail>) => {
    setTask((prev) => {
      if (!prev) return prev;
      return { ...prev, ...changes };
    });
    setHasUnsavedChanges(true);
  }, []);

  // 4) uploadAttachment
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
        } catch (err) {
          console.error("Upload attachment error:", err);
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

  // 5) saveExistingTask
  const saveExistingTask = useCallback(async (): Promise<boolean> => {
    if (!currentTaskId || !task) return false;
    const payload: Partial<TaskDetail> = pickUpdatable(task);
    try {
      const result = await updateTaskMutation({
        taskId: currentTaskId,
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
  }, [currentTaskId, task, updateTaskMutation, onTaskUpdate]);

  // 6) saveNewTask
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
          created_at: (result as any).created_at ?? prev.created_at,
          updated_at: (result as any).updated_at ?? prev.updated_at,
        };
      });
      onTaskAdded?.({
        ...task,
        id: result.id,
        column_id: columnId,
        board_id: boardId,
        created_at: (result as any).created_at ?? undefined,
        updated_at: (result as any).updated_at ?? undefined,
      });
      return true;
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Failed to create task");
      return false;
    }
  }, [task, columnId, boardId, addTaskMutation, onTaskAdded]);

  // 7) deleteTask
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
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task");
    }
  }, [currentTaskId, task, columnId, removeTaskMutation, onClose]);

  // 8) fetchTaskData
  const fetchTaskData = useCallback(async () => {
    if (currentTaskId) {
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

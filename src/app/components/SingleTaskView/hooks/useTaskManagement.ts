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
      // Update local task state
      setTask(fetchedTask);
      setHasUnsavedChanges(false);
      setError(null);

      // If there are pending attachments (from Add Mode), upload them now:
      if (pendingAttachments.length > 0) {
        pendingAttachments.forEach(async (file) => {
          try {
            // uploadAttachmentMutation expects taskId and userId
            if (currentTaskId && currentUser?.id) {
              const result = await uploadAttachmentMutation({
                file,
                taskId: currentTaskId,
                userId: currentUser.id,
              }).unwrap();
              // append to local attachments list
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
        // Clear pendingAttachments after attempting upload
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

  // 2) Initialize local state for Add Mode (once, on mount or when switching to add mode)
  useEffect(() => {
    if (isNewTask) {
      // Create an "empty" TaskDetail. Note: id is null/empty until creation.
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

  // 3) Local updateTask: merges changes into local task and mark unsaved
  const updateTask = useCallback((changes: Partial<TaskDetail>) => {
    setTask((prev) => {
      if (!prev) return prev;
      return { ...prev, ...changes };
    });
    setHasUnsavedChanges(true);
  }, []);

  // 4) uploadAttachment: if editing or after create (currentTaskId exists), upload immediately; else collect in pendingAttachments
  const uploadAttachment = useCallback(
    async (file: File) => {
      // If we already have a valid task ID, upload immediately
      if (currentTaskId && currentUser?.id) {
        try {
          const result = await uploadAttachmentMutation({
            file,
            taskId: currentTaskId,
            userId: currentUser.id,
          }).unwrap();
          // Add to local attachments
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
        // Add to pending list to upload after creation
        setPendingAttachments((prev) => [...prev, file]);
        return null;
      }
    },
    [currentTaskId, currentUser?.id, uploadAttachmentMutation]
  );

  // 5) saveExistingTask for edit mode
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

  // 6) saveNewTask for add mode
  const saveNewTask = useCallback(async (): Promise<boolean> => {
    if (!task || !columnId) return false;
    // Prepare payload for creation (only relevant fields)
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
      // other fields if desired
    };
    try {
      const result = await addTaskMutation(payload).unwrap();
      // result is Task (with id, title, etc.)
      // Set currentTaskId so that fetch can run
      setCurrentTaskId(result.id);
      // Mark unsavedChanges false for now; after fetch, hasUnsavedChanges remains false
      setHasUnsavedChanges(false);
      // Optionally update local task immediately with returned fields
      setTask((prev) => {
        // Merge returned fields (id, created_at, etc.) into local TaskDetail
        if (!prev) return prev;
        return {
          ...prev,
          id: result.id,
          // if result has created_at, updated_at, etc., merge them:
          created_at: (result as any).created_at ?? prev.created_at,
          updated_at: (result as any).updated_at ?? prev.updated_at,
          // other fields from result if needed
        };
      });
      // Notify parent of newly created task (parent can add to UI list)
      onTaskAdded?.(
        // Construct a TaskDetail-like object or minimal object with id/title
        {
          ...task,
          id: result.id,
          column_id: columnId,
          board_id: boardId,
          // created_at/updated_at if available
          created_at: (result as any).created_at ?? undefined,
          updated_at: (result as any).updated_at ?? undefined,
        }
      );
      // After setting currentTaskId, the fetchEffect will run, fetching full details,
      // then uploading any pendingAttachments.
      return true;
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Failed to create task");
      return false;
    }
  }, [task, columnId, boardId, addTaskMutation, onTaskAdded]);

  // 7) deleteTask (edit mode)
  const deleteTask = useCallback(async () => {
    if (!currentTaskId || !columnId) return;
    try {
      await removeTaskMutation({ taskId: currentTaskId, columnId }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task");
    }
  }, [currentTaskId, columnId, removeTaskMutation, onClose]);

  // 8) fetchTaskData (refetch)
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

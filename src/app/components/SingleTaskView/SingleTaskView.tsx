"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { supabase } from "../../lib/api";
import {
  addTask,
  deleteTask,
  getPriorities,
  updateTaskDetails,
  getTaskById,
} from "../../lib/api";
import { TaskDetail, Comment, User, Priority } from "./types";
import TaskHeader from "./TaskHeader";
import TaskContent from "./TaskContent";
import CommentsSection from "./CommentsSection";
import ActionFooter from "./ActionFooter";
import TaskFooter from "./TaskFooter";
import ImagePreviewModal from "./ImagePreviewModal";

interface SingleTaskViewProps {
  taskId?: string;
  mode: "add" | "edit";
  columnId?: string;
  boardId?: string;
  onClose: () => void;
  onTaskUpdate?: () => void;
  onTaskAdd?: (newTask: { id: string; title: string }) => void;
  onTaskAdded?: (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => Promise<any>;
  currentUser: User;
  priorities?: Array<{ id: string; label: string; color: string }>;
}

const SingleTaskView = ({
  taskId,
  mode,
  columnId,
  boardId,
  onClose,
  onTaskUpdate,
  onTaskAdd,
  onTaskAdded,
  currentUser,
}: SingleTaskViewProps) => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isNewTask, setIsNewTask] = useState(mode === "add");
  const [isSaving, setIsSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  useEffect(() => {
    if (mode === "edit" && taskId) {
      fetchTaskData();
      fetchComments();
    } else if (mode === "add") {
      const now = new Date().toISOString();
      setTask({
        id: "",
        title: "",
        description: "",
        column_id: columnId || "",
        created_at: now,
        updated_at: now,
        order: 0,
        priority: null,
        user_id: null,
        assignee: null,
        priority_info: null,
        attachments: [],
      });
      setLoading(false);
    }

    fetchAvailableUsers();
  }, [taskId, mode, columnId]);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const prioritiesData = await getPriorities();
        setPriorities(prioritiesData);
      } catch (error) {
        console.error("Error fetching priorities:", error);
      }
    };

    fetchPriorities();
  }, []);

  const fetchTaskData = async () => {
    if (!taskId) return;

    try {
      const taskData = await getTaskById(taskId);

      const completeTask: TaskDetail = {
        id: taskData.id,
        title: taskData.title || "",
        description: taskData.description || "",
        column_id: taskData.column_id,
        created_at: taskData.created_at,
        updated_at: taskData.updated_at,
        order: taskData.order || 0,
        priority: taskData.priority || null,
        user_id: taskData.user_id || null,
        assignee: taskData.assignee || null,
        priority_info: taskData.priority_info || null,
        attachments: taskData.attachments || [],
      };

      setTask(completeTask);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Nie udało się załadować zadania");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!taskId) return;

    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          if (comment.user_id) {
            const { data: authorData } = await supabase
              .from("users")
              .select("id, name, email, image")
              .eq("id", comment.user_id)
              .single();

            return {
              ...comment,
              author: authorData || null,
            };
          }
          return {
            ...comment,
            author: null,
          };
        })
      );

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, image")
        .order("name");

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  /**
   * Updates an existing task in the database
   * Handles field validation and error recovery
   */
  const handleUpdateTask = async (updates: Partial<TaskDetail>) => {
    if (!task) return;

    try {
      // Update local state
      setTask((prev) => (prev ? { ...prev, ...updates } : null));

      // If not a new task, save to database
      if (!isNewTask && task.id) {
        await updateTaskDetails(task.id, updates);

        // Refresh task data after update
        if (taskId) {
          await fetchTaskData();
        }

        // Call parent callback
        onTaskUpdate?.();

        toast.success("Task updated successfully!");
      } else {
        // For new tasks, just mark as having unsaved changes
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task");

      // Revert local state on error
      if (!isNewTask && taskId) {
        await fetchTaskData();
      }
    }
  };

  /**
   * Saves changes to an existing task
   * Closes modal after successful save
   */
  const handleSaveExistingTask = async () => {
    if (!task || !task.id) return;

    setIsSaving(true);
    try {
      const updates: Partial<TaskDetail> = {
        title: task.title.trim(),
        description: task.description?.trim() || "",
        priority: task.priority || null,
        user_id: task.user_id || null,
      };

      await updateTaskDetails(task.id, updates);

      // Odśwież board TYLKO po zapisaniu, nie przy każdej zmianie
      onTaskUpdate?.();

      setHasUnsavedChanges(false);
      toast.success("Task saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Creates a new task in the database
   * Validates required fields and refreshes board data
   */
  const handleSaveNewTask = async () => {
    if (!task || !task.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!columnId) {
      toast.error("Cannot create task - missing column ID");
      return;
    }

    setIsSaving(true);
    try {
      // Validate column exists
      const { data: columnExists, error: columnError } = await supabase
        .from("columns")
        .select("id")
        .eq("id", columnId)
        .single();

      if (columnError || !columnExists) {
        toast.error("Column does not exist");
        return;
      }

      // Prepare task data
      const taskData: any = {
        column_id: columnId,
        title: task.title.trim(),
        order: 0,
      };

      if (task.description?.trim()) {
        taskData.description = task.description.trim();
      }

      if (task.priority) {
        taskData.priority = task.priority;
      }

      if (task.user_id) {
        taskData.user_id = task.user_id;
      }

      // Insert task with full data (including joins)
      const { data: newTask, error: insertError } = await supabase
        .from("tasks")
        .insert(taskData)
        .select(
          `
          *,
          assignee:users!tasks_user_id_fkey(id, name, email, image),
          priorities(id, label, color)
        `
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      if (onTaskAdded) {
        try {
          await onTaskAdded(
            columnId,
            task.title.trim(),
            task.priority || undefined,
            task.user_id || undefined
          );
        } catch (callbackError) {
          console.error("Error in onTaskAdded callback:", callbackError);
          onTaskUpdate?.();
        }
      } else {
        onTaskUpdate?.();
      }

      onClose();
      setHasUnsavedChanges(false);
      toast.success("Task created successfully!");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Deletes the current task after confirmation
   */
  const handleDeleteTask = async () => {
    if (!taskId) return;

    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setIsSaving(true);
    try {
      await deleteTask(taskId);
      onTaskUpdate?.();
      onClose();
      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && isNewTask) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  };

  const handleUnsavedChangesAlert = () => {
    setShowUnsavedAlert(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg">
          <div className="text-white">Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg">
          <div className="text-white">Nie znaleziono zadania</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {!isNewTask ? (
            <TaskHeader
              task={task}
              onClose={handleClose}
              onUpdateTask={handleUpdateTask}
              hasUnsavedChanges={hasUnsavedChanges}
              onUnsavedChangesAlert={handleUnsavedChangesAlert}
            />
          ) : (
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h2 className="text-xl font-semibold text-white">Nowe zadanie</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <TaskContent
                task={task}
                currentUser={currentUser}
                availableUsers={availableUsers}
                priorities={priorities}
                onUpdateTask={handleUpdateTask}
                onRefreshTask={fetchTaskData}
                taskId={taskId || ""}
                setHasUnsavedChanges={setHasUnsavedChanges}
                isNewTask={isNewTask}
              />

              {!isNewTask && taskId && task && (
                <CommentsSection
                  taskId={taskId}
                  comments={comments}
                  currentUser={currentUser}
                  task={task}
                  onRefreshComments={fetchComments}
                  onRefreshTask={fetchTaskData}
                  onImagePreview={setImagePreview}
                />
              )}
            </div>

            {!isNewTask && <TaskFooter task={task} currentUser={currentUser} />}
          </div>

          <ActionFooter
            isNewTask={isNewTask}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onSave={isNewTask ? handleSaveNewTask : handleSaveExistingTask}
            onClose={handleClose}
            onDelete={!isNewTask ? handleDeleteTask : undefined}
            task={task}
          />
        </motion.div>
      </motion.div>

      {imagePreview && (
        <ImagePreviewModal
          imageUrl={imagePreview}
          onClose={() => setImagePreview(null)}
        />
      )}

      {showUnsavedAlert && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Niezapisane zmiany
            </h3>
            <p className="text-gray-300 mb-6">
              Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnsavedAlert(false)}
                className="px-4 py-2 text-gray-300 border border-gray-500 rounded hover:bg-gray-700"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  setShowUnsavedAlert(false);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Zamknij bez zapisywania
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleTaskView;

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId && mode === "edit") {
      fetchTaskData();
    } else if (mode === "add") {
      // Initialize new task
      setTask({
        id: "",
        title: "",
        column_id: columnId || "",
        description: "",
        priority: null,
        user_id: null,
        images: [],
        attachments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsNewTask(true);
      setLoading(false);
    }

    fetchAvailableUsers();
  }, [taskId, mode]);

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

    setLoading(true);
    try {
      const taskData = await getTaskById(taskId);

      // Pobierz załączniki
      const { data: attachments, error: attachError } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (attachError) {
        console.error("Error fetching attachments:", attachError);
      }

      setTask({
        ...taskData,
        attachments: attachments || [],
      });
    } catch (error) {
      console.error("Error fetching task:", error);
      setError("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches comments for a task with author information
   * Used for displaying comment history in task details
   */
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

  /**
   * Fetches users available for task assignment
   * Filters users based on teams assigned to the current board
   * Falls back to all users if no board or teams are assigned
   */
  const fetchAvailableUsers = async () => {
    try {
      if (!boardId) {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, image")
          .order("name");

        if (error) throw error;
        setAvailableUsers(data || []);
        return;
      }

      const { data: boardTeams, error: boardTeamsError } = await supabase
        .from("board_access")
        .select("team_id")
        .eq("board_id", boardId);

      if (boardTeamsError) {
        console.error("Error fetching board teams:", boardTeamsError);
        setAvailableUsers([]);
        return;
      }

      if (!boardTeams || boardTeams.length === 0) {
        setAvailableUsers([]);
        return;
      }

      const teamIds = boardTeams.map((bt) => bt.team_id);

      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select(
          `
          user_id,
          users!inner(id, name, email, image)
        `
        )
        .in("team_id", teamIds);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        setAvailableUsers([]);
        return;
      }

      const uniqueUsers =
        teamMembers?.reduce((acc: User[], member: any) => {
          const user = member.users;
          if (user && !acc.find((u: User) => u.id === user.id)) {
            acc.push({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            } as User);
          }
          return acc;
        }, []) || [];

      setAvailableUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
    }
  };

  /**
   * Updates an existing task in the database
   * Handles field validation and error recovery
   */
  const handleUpdateTask = async (updates: Partial<TaskDetail>) => {
    if (!task) return;

    setTask((prev) => (prev ? { ...prev, ...updates } : null));

    if (isNewTask) {
      setHasUnsavedChanges(true);
    } else {
      try {
        if (task.id) {
          await updateTaskDetails(task.id, updates);
          onTaskUpdate?.();
          toast.success("Task updated successfully!");
        }
      } catch (error) {
        console.error("Error updating task:", error);
        toast.error("Error updating task");
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
      const updates = {
        title: task.title.trim(),
        description: task.description?.trim() || "",
        priority: task.priority || null,
        user_id: task.user_id || null,
      };

      await updateTaskDetails(task.id, updates);
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
      if (onTaskAdded) {
        await onTaskAdded(
          columnId,
          task.title.trim(),
          task.priority || undefined,
          task.user_id || undefined
        );
      } else {
        toast.error("Cannot create task - no callback provided");
        return;
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
   * Deletes the current task after user confirmation
   * Refreshes parent component data on success
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

  /**
   * Handles modal close with unsaved changes check
   * Shows confirmation dialog for new tasks with unsaved changes
   */
  const handleClose = () => {
    if (hasUnsavedChanges && isNewTask) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  };

  /**
   * Triggers unsaved changes alert dialog
   * Used by child components to warn about data loss
   */
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

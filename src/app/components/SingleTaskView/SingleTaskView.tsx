"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";
import { TaskDetail, Comment, User, Priority } from "./types";
import TaskHeader from "./TaskHeader";
import TaskContent from "./TaskContent";
import CommentsSection from "./CommentsSection";
import TaskFooter from "./TaskFooter";
import ImagePreviewModal from "./ImagePreviewModal";

interface SingleTaskViewProps {
  taskId?: string; // ✅ Opcjonalne - dla nowych tasków
  mode: "add" | "edit"; // ✅ Tryb modal
  columnId?: string; // ✅ Wymagane dla trybu add
  boardId?: string; // ✅ Wymagane dla trybu add
  onClose: () => void;
  onTaskUpdate?: () => void;
  onTaskAdd?: (newTask: { id: string; title: string }) => void; // ✅ Callback dla nowych tasków
  currentUser: User;
}

const SingleTaskView = ({
  taskId,
  mode,
  columnId,
  boardId,
  onClose,
  onTaskUpdate,
  onTaskAdd,
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
      setTask({
        id: "",
        title: "",
        description: "",
        column_id: columnId || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order: 0,
        priority: undefined,
        user_id: undefined,
        assignee: undefined,
        priority_info: undefined,
        attachments: [],
      });
      setLoading(false);
    }

    fetchAvailableUsers();
    fetchPriorities();
  }, [taskId, mode, columnId]);

  const fetchTaskData = async () => {
    try {
      // Fetch basic task data
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;

      // Fetch assignee if exists
      let assignee = null;
      if (taskData.user_id) {
        const { data: assigneeData } = await supabase
          .from("users")
          .select("id, name, email, image")
          .eq("id", taskData.user_id)
          .single();
        assignee = assigneeData;
      }

      // Fetch priority if exists
      let priority_info = null;
      if (taskData.priority) {
        const { data: priorityData } = await supabase
          .from("priorities")
          .select("id, label, color")
          .eq("id", taskData.priority)
          .single();
        priority_info = priorityData;
      }

      // Fetch attachments
      const { data: attachmentsData } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId);

      setTask({
        ...taskData,
        assignee,
        priority_info,
        attachments: attachmentsData || [],
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Error loading task");
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch authors for each comment
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from("users")
            .select("id, name, email, image")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            author: authorData,
          };
        })
      );

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error loading comments");
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchPriorities = async () => {
    try {
      const { data, error } = await supabase
        .from("priorities")
        .select("*")
        .order("id");

      if (error) throw error;
      setPriorities(data || []);
    } catch (error) {
      console.error("Error fetching priorities:", error);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedAlert(true);
    } else {
      onClose();
    }
  };

  const updateTask = async (updates: Partial<TaskDetail>): Promise<void> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      await fetchTaskData();
      onTaskUpdate?.();
      setHasUnsavedChanges(false);
      toast.success("Task updated");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Error updating task");
      throw error;
    }
  };

  const saveNewTask = async () => {
    if (!task || !task.title.trim() || !columnId) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: task.title,
            description: task.description || "",
            column_id: columnId,
            priority: task.priority,
            user_id: task.user_id,
            order: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Task created successfully");

      if (onTaskAdd) {
        onTaskAdd({ id: data.id, title: data.title });
      }

      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error creating task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (isNewTask) {
      await saveNewTask();
    } else {
      if (task) {
        await updateTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          user_id: task.user_id,
        });
      }
    }
  };

  const updateTaskState = async (
    updates: Partial<TaskDetail>
  ): Promise<void> => {
    setTask((prev) => (prev ? { ...prev, ...updates } : null));
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-200">Loading...</p>
        </motion.div>
      </div>
    );
  }
  if (!task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg p-8"
        >
          <p className="text-center text-gray-200">Task not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto cursor-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              {isNewTask ? "Add New Task" : "Edit Task"}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !task?.title?.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <TaskContent
            task={task}
            currentUser={currentUser}
            availableUsers={availableUsers}
            priorities={priorities}
            onUpdateTask={isNewTask ? updateTaskState : updateTask}
            onRefreshTask={isNewTask ? () => Promise.resolve() : fetchTaskData}
            taskId={taskId || ""}
            setHasUnsavedChanges={setHasUnsavedChanges}
            isNewTask={isNewTask}
          />

          {!isNewTask && (
            <CommentsSection
              taskId={taskId!}
              comments={comments}
              currentUser={currentUser}
              task={task!}
              onRefreshComments={fetchComments}
              onRefreshTask={fetchTaskData}
              onImagePreview={setImagePreview}
            />
          )}

          {!isNewTask && <TaskFooter task={task!} currentUser={currentUser} />}
        </motion.div>
      </motion.div>

      {showUnsavedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Unsaved Changes
            </h3>
            <p className="text-gray-300 mb-6">
              You have unsaved changes. Do you want to save them before closing?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUnsavedAlert(false);
                  onClose();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Discard
              </button>
              <button
                onClick={() => setShowUnsavedAlert(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleTaskView;

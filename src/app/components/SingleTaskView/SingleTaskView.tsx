"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  deleteTask,
  getPriorities,
  updateTaskDetails,
  updateTaskDates,
} from "../../lib/api";
import { TaskDetail, User, Priority, Attachment } from "./types";
import TaskHeader from "./TaskHeader";
import TaskContent from "./TaskContent";
import CommentsSection from "./CommentsSection";
import AttachmentsList from "./AttachmentsList";
import ActionFooter from "./ActionFooter";
import TaskFooter from "./TaskFooter";
import ImagePreviewModal from "./ImagePreviewModal";
import { useTaskData } from "./hooks/useTaskData";
import { useTaskComments } from "./hooks/useTaskComments";
import { useAvailableUsers } from "./hooks/useAvailableUsers";

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
  // Use the useTaskData hook
  const {
    task,
    loading,
    error,
    setTask,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchTaskData,
  } = useTaskData(taskId, mode, columnId);
  const [isNewTask, setIsNewTask] = useState(mode === "add");
  const [isSaving, setIsSaving] = useState(false);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  // Use the useTaskComments hook
  const { comments, fetchComments } = useTaskComments(taskId);

  // Use the useAvailableUsers hook
  const { availableUsers } = useAvailableUsers(boardId);

  useEffect(() => {
    setIsNewTask(mode === "add");
  }, [mode]);

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

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [hasUnsavedChanges, isNewTask]);

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
   * Updates task dates when date fields change
   * Sets unsaved changes flag for all tasks (new and existing)
   */
  const handleDateChange = (dateType: "start" | "end", value: string) => {
    if (dateType === "start") {
      setStartDate(value);
      // Clear end date if it's before start date
      if (endDate && value && new Date(value) > new Date(endDate)) {
        setEndDate("");
      }
    } else {
      setEndDate(value);
    }

    // Always mark as having unsaved changes
    setHasUnsavedChanges(true);
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

      // Update dates if they changed
      const currentStartDate = (task as any).start_date;
      const currentEndDate = (task as any).end_date;

      if (startDate !== currentStartDate || endDate !== currentEndDate) {
        await updateTaskDates(task.id, startDate || null, endDate || null);
      }

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
      let newTask;
      if (onTaskAdded) {
        newTask = await onTaskAdded(
          columnId,
          task.title.trim(),
          task.priority || undefined,
          task.user_id || undefined
        );
      } else {
        toast.error("Cannot create task - no callback provided");
        return;
      }

      // Add dates to newly created task if provided
      if ((startDate || endDate) && newTask?.id) {
        await updateTaskDates(newTask.id, startDate || null, endDate || null);
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
   * Shows confirmation dialog for tasks with unsaved changes
   */
  const handleClose = () => {
    if (hasUnsavedChanges) {
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

  // Add function for local attachment updates
  const updateAttachmentsLocally = useCallback(
    (updater: (attachments: Attachment[]) => Attachment[]) => {
      setTask((prevTask) => {
        if (!prevTask) return prevTask;
        return {
          ...prevTask,
          attachments: updater(prevTask.attachments || []),
        };
      });
    },
    [setTask]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg">
          <div className="text-white">Task not found</div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Close
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
              <h2 className="text-xl font-semibold text-white">New Task</h2>
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
                taskId={taskId || ""}
                setHasUnsavedChanges={setHasUnsavedChanges}
                isNewTask={isNewTask}
                onTaskUpdate={fetchTaskData}
                onAttachmentsUpdate={updateAttachmentsLocally}
              />

              {/* Date fields section */}
              <div className="p-6 border-t border-gray-600">
                <h3 className="text-lg font-medium text-white mb-4">
                  Task Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Start Date
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) =>
                        handleDateChange("start", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="end-date"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      End Date
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateChange("end", e.target.value)}
                      min={startDate}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {!isNewTask && taskId && task && (
                <CommentsSection
                  taskId={taskId}
                  comments={comments}
                  currentUser={currentUser}
                  task={task}
                  onRefreshComments={fetchComments}
                  onImagePreview={setImagePreview}
                />
              )}

              {/* Attachments section */}
              {!isNewTask && taskId && task && (
                <AttachmentsList
                  taskId={taskId}
                  attachments={task.attachments || []}
                  currentUser={currentUser}
                  onTaskUpdate={fetchTaskData}
                  onAttachmentsUpdate={updateAttachmentsLocally}
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
              Unsaved Changes
            </h3>
            <p className="text-gray-300 mb-6">
              You have unsaved changes. Are you sure you want to close?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnsavedAlert(false)}
                className="px-4 py-2 text-gray-300 border border-gray-500 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUnsavedAlert(false);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleTaskView;

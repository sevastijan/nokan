"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { updateTaskDetails } from "../../lib/api";
import { TaskDetail, Attachment, SingleTaskViewProps } from "./types";
import TaskHeader from "./TaskHeader";
import TaskContent from "./TaskContent";
import CommentsSection from "./CommentsSection";
import ActionFooter from "./ActionFooter";
import TaskFooter from "./TaskFooter";
import ImagePreviewModal from "./ImagePreviewModal";
import Button from "../Button/Button";
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaFlag,
  FaLink,
} from "react-icons/fa";
import { useTaskData } from "./hooks/useTaskData";
import { useTaskComments } from "./hooks/useTaskComments";
import { useAvailableUsers } from "./hooks/useAvailableUsers";
import { usePriorities } from "./hooks/usePriorities";
import { useImagePreview } from "./hooks/useImagePreview";
import { useUnsavedChanges } from "./hooks/useUnsavedChanges";
import { useTaskDates } from "./hooks/useTaskDates";
import { useTaskOperations } from "./hooks/useTaskOperations";
import "./styles/styles.css";

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
  const [isNewTask, setIsNewTask] = useState(mode === "add");

  // Use all the hooks
  const { task, loading, error, setTask, fetchTaskData } = useTaskData(
    taskId,
    mode,
    columnId
  );

  const { comments, fetchComments } = useTaskComments(taskId);
  const { availableUsers } = useAvailableUsers(boardId);
  const { priorities } = usePriorities();
  const { imagePreview, openImagePreview, closeImagePreview } =
    useImagePreview();

  const {
    hasUnsavedChanges,
    showUnsavedAlert,
    markAsChanged,
    markAsSaved,
    showUnsavedChangesAlert,
    hideUnsavedChangesAlert,
  } = useUnsavedChanges(isNewTask);

  const { startDate, endDate, handleDateChange } = useTaskDates(
    (task as any)?.start_date || "",
    (task as any)?.end_date || ""
  );

  // Create adapter function for task creation
  const handleTaskCreation = useCallback(
    async (
      columnId: string,
      title: string,
      priority?: number,
      userId?: number
    ) => {
      if (onTaskAdded) {
        return await onTaskAdded(columnId, title, priority, userId);
      } else if (onTaskAdd) {
        const newTask = { id: "temp-id", title };
        await onTaskAdd(newTask);
        return newTask;
      }
      throw new Error("No task creation callback provided");
    },
    [onTaskAdded, onTaskAdd]
  );

  const {
    isSaving,
    handleSaveExistingTask,
    handleSaveNewTask,
    handleDeleteTask,
  } = useTaskOperations({
    task,
    taskId,
    columnId,
    isNewTask,
    startDate,
    endDate,
    onTaskUpdate,
    onTaskAdded: handleTaskCreation,
    onClose,
    markAsSaved,
  });

  useEffect(() => {
    setIsNewTask(mode === "add");
  }, [mode]);

  /**
   * Updates an existing task in the database
   * Handles field validation and error recovery
   */
  const handleUpdateTask = async (updates: Partial<TaskDetail>) => {
    if (!task) return;

    setTask((prev) => (prev ? { ...prev, ...updates } : null));

    if (isNewTask) {
      markAsChanged();
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
   * Handles modal close with unsaved changes check
   * Shows confirmation dialog for tasks with unsaved changes
   */
  const handleClose = () => {
    if (hasUnsavedChanges) {
      showUnsavedChangesAlert();
    } else {
      onClose();
    }
  };

  /**
   * Handle date changes with unsaved changes tracking
   */
  const handleDateChangeWithTracking = (
    dateType: "start" | "end",
    value: string
  ) => {
    handleDateChange(dateType, value, markAsChanged);
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

  /**
   * Copy task link to clipboard
   */
  const handleCopyLink = async () => {
    if (!task?.id) return;

    const taskUrl = `${window.location.origin}${window.location.pathname}?task=${task.id}`;

    try {
      await navigator.clipboard.writeText(taskUrl);
      toast.success("Task link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-slate-800/90 border border-slate-700/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <div className="text-slate-200 font-medium">Loading task...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-slate-800/90 border border-slate-700/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
          <div className="text-slate-200 mb-4 font-medium">Task not found</div>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            icon={<FaTimes />}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

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
          className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Enhanced Header */}
          <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                {/* Task Status Indicator */}
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>

                {/* Task ID and Title */}
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-sm font-mono bg-slate-700/50 px-2 py-1 rounded-md">
                    #{task.id?.slice(-8) || "NEW"}
                  </span>
                  <h1 className="text-xl font-semibold text-white">
                    {isNewTask ? "New Task" : task.title}
                  </h1>
                </div>

                {/* Priority Badge */}
                {task.priority && (
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    <div className="flex items-center space-x-1">
                      <FaFlag className="w-3 h-3" />
                      <span className="capitalize">{task.priority}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                )}

                {/* Copy Link Button */}
                {!isNewTask && task?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    icon={<FaLink />}
                    className="text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors"
                    title="Copy task link"
                  />
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  icon={<FaTimes />}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Task Content */}
                <TaskContent
                  task={task}
                  currentUser={currentUser}
                  availableUsers={availableUsers}
                  priorities={priorities}
                  onUpdateTask={handleUpdateTask}
                  taskId={taskId || ""}
                  setHasUnsavedChanges={markAsChanged}
                  isNewTask={isNewTask}
                  onTaskUpdate={fetchTaskData}
                  onAttachmentsUpdate={updateAttachmentsLocally}
                />

                {/* Enhanced Schedule Section */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <FaCalendarAlt className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Schedule
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                        <FaClock className="w-4 h-4 text-green-400" />
                        <span>Start Date</span>
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          handleDateChangeWithTracking("start", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                        <FaClock className="w-4 h-4 text-red-400" />
                        <span>Due Date</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                          handleDateChangeWithTracking("end", e.target.value)
                        }
                        min={startDate}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Date Range Indicator */}
                  {startDate && endDate && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-400 text-sm">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>
                          Duration:{" "}
                          {Math.ceil(
                            (new Date(endDate).getTime() -
                              new Date(startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                {!isNewTask && taskId && task && (
                  <div className="bg-slate-700/30 rounded-xl border border-slate-600/30 overflow-hidden">
                    <CommentsSection
                      taskId={taskId}
                      comments={comments}
                      currentUser={currentUser}
                      task={task}
                      onRefreshComments={fetchComments}
                      onImagePreview={openImagePreview}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="w-80 bg-slate-800/50 border-l border-slate-700/50 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Task Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Task Details
                  </h3>

                  {/* Assignee */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-slate-400">
                      <FaUser className="w-4 h-4" />
                      <span>Assignee</span>
                    </label>
                    {task.assignee ? (
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                        {task.assignee.image ? (
                          <img
                            src={task.assignee.image}
                            alt={task.assignee.name}
                            className="w-8 h-8 rounded-full border-2 border-slate-600"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium">
                            {task.assignee.name}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {task.assignee.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-700/30 border border-slate-600/30 rounded-lg text-slate-400 text-sm">
                        No assignee set
                      </div>
                    )}
                  </div>

                  {/* Creation Info */}
                  <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <h4 className="text-sm font-medium text-slate-300">
                      Created
                    </h4>
                    <div className="text-sm text-slate-400">
                      {task.created_at
                        ? new Date(task.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Unknown"}
                    </div>
                    {task.updated_at && (
                      <>
                        <h4 className="text-sm font-medium text-slate-300 mt-3">
                          Last Updated
                        </h4>
                        <div className="text-sm text-slate-400">
                          {new Date(task.updated_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 p-6">
            <ActionFooter
              isNewTask={isNewTask}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              onSave={isNewTask ? handleSaveNewTask : handleSaveExistingTask}
              onClose={handleClose}
              onDelete={!isNewTask ? handleDeleteTask : undefined}
              task={task}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <ImagePreviewModal
          imageUrl={imagePreview}
          onClose={closeImagePreview}
        />
      )}

      {/* Enhanced Unsaved Changes Dialog */}
      {showUnsavedAlert && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-[60]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl max-w-md shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <FaClock className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Unsaved Changes
              </h3>
            </div>

            <p className="text-slate-300 mb-6 leading-relaxed">
              You have unsaved changes that will be lost. Are you sure you want
              to close without saving?
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                size="md"
                onClick={hideUnsavedChangesAlert}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  hideUnsavedChangesAlert();
                  onClose();
                }}
              >
                Close without saving
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default SingleTaskView;

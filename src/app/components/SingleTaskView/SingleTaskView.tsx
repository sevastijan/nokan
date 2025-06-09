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
import { FaTimes } from "react-icons/fa";
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
          <div className="text-white mb-4">Task not found</div>
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
              onUnsavedChangesAlert={showUnsavedChangesAlert}
            />
          ) : (
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h2 className="text-xl font-semibold text-white">New Task</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                icon={<FaTimes />}
              />
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
                setHasUnsavedChanges={markAsChanged}
                isNewTask={isNewTask}
                onTaskUpdate={fetchTaskData}
                onAttachmentsUpdate={updateAttachmentsLocally}
              />
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
                        handleDateChangeWithTracking("start", e.target.value)
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
                      onChange={(e) =>
                        handleDateChangeWithTracking("end", e.target.value)
                      }
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
                  onImagePreview={openImagePreview}
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
          onClose={closeImagePreview}
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
          </div>
        </div>
      )}
    </>
  );
};

export default SingleTaskView;

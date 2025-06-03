"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaEdit } from "react-icons/fa";
import { TaskDetail } from "./types";
import ConfirmDialog from "./ConfirmDialog";

interface TaskHeaderProps {
  task: TaskDetail | null;
  onClose: () => void;
  onUpdateTask: (updates: Partial<TaskDetail>) => void;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesAlert?: () => void;
}

/**
 * TaskHeader component shows the task title with edit and close options.
 * Handles title editing with save, discard, and unsaved changes confirmation.
 */
const TaskHeader = ({
  task,
  onClose,
  onUpdateTask,
  hasUnsavedChanges = false,
  onUnsavedChangesAlert,
}: TaskHeaderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Update editedTitle when task title changes
  useEffect(() => {
    setEditedTitle(task?.title || "");
  }, [task?.title]);

  /**
   * Save edited title if changed and not empty
   */
  const handleTitleSave = async () => {
    if (task && editedTitle !== task.title && editedTitle.trim()) {
      await onUpdateTask({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  /**
   * Discard changes and reset title input
   */
  const handleDiscardChanges = () => {
    setEditedTitle(task?.title || "");
    setIsEditingTitle(false);
  };

  /**
   * Show confirmation dialog before discarding changes or closing
   * @param action function to call after confirming
   */
  const showConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  /**
   * Confirm action from dialog
   */
  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  /**
   * Cancel confirmation dialog
   */
  const handleCancel = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  /**
   * Handle keyboard events for input: Enter saves, Escape cancels
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(task?.title || "");
      setIsEditingTitle(false);
    }
  };

  /**
   * Handle close button click
   * If editing with unsaved changes, confirm discard first
   * Otherwise alert or close directly
   */
  const handleClose = () => {
    if (isEditingTitle && editedTitle.trim() !== (task?.title || "")) {
      showConfirm(() => {
        handleDiscardChanges();
        if (hasUnsavedChanges && onUnsavedChangesAlert) {
          onUnsavedChangesAlert();
        } else {
          onClose();
        }
      });
    } else if (hasUnsavedChanges && onUnsavedChangesAlert) {
      onUnsavedChangesAlert();
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-600">
        <div className="flex-1 mr-4">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleTitleSave}
                className="text-xl font-bold bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-200">
                {task?.id ? `ID: [${task.id.slice(0, 8)}] - ` : ""}
                {task?.title}
              </h1>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditingTitle(true)}
                className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
              >
                <FaEdit className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-200 rounded cursor-pointer"
        >
          <FaTimes className="w-5 h-5" />
        </motion.button>
      </div>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Unsaved Changes"
        message="You have unsaved changes in the title. Do you want to discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type="warning"
      />
    </>
  );
};

export default TaskHeader;

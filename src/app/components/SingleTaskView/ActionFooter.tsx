"use client";

import React, { useState } from "react";
import { TaskDetail } from "./types";
import ConfirmDialog from "./ConfirmDialog";

interface ActionFooterProps {
  /** Indicates if this is a new task */
  isNewTask: boolean;

  /** Indicates if there are unsaved changes */
  hasUnsavedChanges: boolean;

  /** Indicates if the save operation is currently in progress */
  isSaving: boolean;

  /** Callback function to handle save action */
  onSave: () => void;

  /** Callback function to handle close/cancel action */
  onClose: () => void;

  /** Optional callback function to handle delete action */
  onDelete?: () => void;

  /** The task being edited or viewed */
  task?: TaskDetail;
}

/**
 * ActionFooter component renders action buttons for saving, canceling, or deleting a task.
 * It conditionally displays the delete button and a confirmation dialog if required.
 */
const ActionFooter = ({
  isNewTask,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onClose,
  onDelete,
  task,
}: ActionFooterProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Determines if the Save button should be enabled.
   * For new tasks, the title must not be empty and there must be unsaved changes.
   */
  const canSave = isNewTask
    ? task?.title?.trim() && hasUnsavedChanges
    : hasUnsavedChanges;

  /** Handles the click event for the Delete button by showing the confirmation dialog */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /** Handles the confirmation of deletion */
  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete();
    }
  };

  /** Cancels the delete confirmation dialog */
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="border-t border-gray-600 p-3 bg-gray-800 flex justify-between items-center">
        {" "}
        <div>
          {!isNewTask && onDelete && (
            <button
              onClick={handleDeleteClick}
              disabled={isSaving}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm" // Smaller button
            >
              Delete
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          {" "}
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-sm" // Smaller button
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm" // Smaller button
          >
            {isSaving
              ? isNewTask
                ? "Creating..."
                : "Saving..."
              : isNewTask
              ? "Create Task"
              : "Save Changes"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </>
  );
};

export default ActionFooter;

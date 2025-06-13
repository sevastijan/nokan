"use client";

import { useState } from "react";
import { TaskDetail } from "@/app/types/globalTypes";
import ConfirmDialog from "./ConfirmDialog";
import Button from "../Button/Button";
import { ActionFooterProps } from "@/app/types/globalTypes";

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
        <div>
          {!isNewTask && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isSaving}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={!canSave || isSaving}
            loading={isSaving}
          >
            {isNewTask ? "Create Task" : "Save Changes"}
          </Button>
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

// src/app/components/SingleTaskView/ActionFooter.tsx
"use client";

import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import Button from "../Button/Button";
import { ActionFooterProps } from "@/app/types/globalTypes";

/**
 * Footer actions for SingleTaskView: Cancel, Save/Create, and optional Delete.
 *
 * Ensures:
 * - Save button enabled only when appropriate (non-empty title & unsaved changes).
 * - On close, if there are unsaved changes, ask user to confirm before closing.
 *
 * @param props.isNewTask - true if creating a new task
 * @param props.hasUnsavedChanges - whether form has unsaved changes
 * @param props.isSaving - whether a save operation is in progress
 * @param props.onSave - callback to invoke when Save/Create is clicked
 * @param props.onClose - callback to invoke when Cancel/Close is confirmed
 * @param props.onDelete - optional callback to invoke when Delete is confirmed
 * @param props.task - the current task object (for title in delete confirmation)
 * @param props.tempTitle - the current (possibly edited) title string
 */
const ActionFooter = ({
  isNewTask,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onClose,
  onDelete,
  task,
  tempTitle,
}: ActionFooterProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  /**
   * Check if title is non-empty (after trimming).
   */
  const titleNotEmpty = Boolean(tempTitle && tempTitle.trim().length > 0);

  /**
   * Determine whether Save/Create button should be enabled.
   * - For new tasks: require non-empty title AND hasUnsavedChanges.
   * - For edits: require hasUnsavedChanges AND non-empty title (adjust if you allow empty title on edit).
   */
  const canSave = isNewTask
    ? titleNotEmpty && hasUnsavedChanges
    : hasUnsavedChanges && titleNotEmpty;

  /**
   * Handle click on Delete: open confirmation dialog.
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * After confirming delete: call onDelete.
   */
  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  /**
   * Handle click on Close/Cancel: if unsaved changes, ask confirm; else directly call onClose.
   */
  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleCloseConfirm = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleCloseCancel = () => {
    setShowCloseConfirm(false);
  };

  return (
    <>
      <div className="border-t border-slate-600 py-5 px-3 md:py-3 bg-slate-800 flex justify-between items-center">
        <div>
          {/* Delete only for existing tasks */}
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
        <div className="flex w-full md:w-auto justify-between md:justify-start md:space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseClick}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={!canSave || isSaving}
            loading={isSaving}
            className="z-10"
          >
            {isNewTask ? "Create Task" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${
          task?.title ?? ""
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Confirm Close Dialog */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmText="Discard"
        cancelText="Keep Editing"
        type="warning"
        onConfirm={handleCloseConfirm}
        onCancel={handleCloseCancel}
      />
    </>
  );
};

export default ActionFooter;

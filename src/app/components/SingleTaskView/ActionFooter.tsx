"use client";

import React, { useState } from "react";
import { TaskDetail } from "./types";
import ConfirmDialog from "./ConfirmDialog";

interface ActionFooterProps {
  isNewTask: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  task?: TaskDetail;
}

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

  const canSave = isNewTask
    ? task?.title?.trim() && hasUnsavedChanges
    : hasUnsavedChanges;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="border-t border-gray-600 p-4 bg-gray-800 flex justify-between items-center">
        <div>
          {!isNewTask && onDelete && (
            <button
              onClick={handleDeleteClick}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 cursor-pointer text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border cursor-pointer  border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

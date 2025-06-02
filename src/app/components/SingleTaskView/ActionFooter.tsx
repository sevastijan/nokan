"use client";

import React from "react";
import { TaskDetail } from "./types";

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
  const canSave = isNewTask
    ? task?.title?.trim() && hasUnsavedChanges
    : hasUnsavedChanges;

  return (
    <div className="border-t border-gray-600 p-4 bg-gray-800 flex justify-between items-center">
      <div>
        {!isNewTask && onDelete && (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this task?")) {
                onDelete();
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  );
};

export default ActionFooter;

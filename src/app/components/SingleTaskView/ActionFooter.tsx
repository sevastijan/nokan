// src/app/components/SingleTaskView/ActionFooter.tsx
"use client";

import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import Button from "../Button/Button";
import { ActionFooterProps } from "@/app/types/globalTypes";

const ActionFooter = ({
  isNewTask,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onClose,
  onDelete,
  task,
  tempTitle, // nowy prop
}: ActionFooterProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Determines if the Save/Create button should be enabled.
   * Dla nowego zadania: wymagamy, żeby tempTitle było niepuste oraz aby były zmiany.
   * Dla edycji: można wymagać tylko hasUnsavedChanges, a ew. też non-empty title (opcjonalnie).
   */
  const titleNotEmpty = Boolean(tempTitle && tempTitle.trim().length > 0);

  const canSave = isNewTask
    ? titleNotEmpty && hasUnsavedChanges
    : hasUnsavedChanges && (task?.title ? task.title.trim().length > 0 : true);
  // lub: hasUnsavedChanges && titleNotEmpty, jeśli chcesz także przy edycji wymagać, by tytuł finalnie nie był pusty

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

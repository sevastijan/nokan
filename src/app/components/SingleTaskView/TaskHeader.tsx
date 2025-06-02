"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaEdit, FaCheck } from "react-icons/fa";
import { TaskDetail } from "./types";

interface TaskHeaderProps {
  task: TaskDetail | null;
  onClose: () => void;
  onUpdateTask: (updates: Partial<TaskDetail>) => void;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesAlert?: () => void;
}

const TaskHeader = ({
  task,
  onClose,
  onUpdateTask,
  hasUnsavedChanges = false,
  onUnsavedChangesAlert,
}: TaskHeaderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");

  useEffect(() => {
    setEditedTitle(task?.title || "");
  }, [task?.title]);

  const hasLocalUnsavedChanges = () => {
    return isEditingTitle && editedTitle.trim() !== (task?.title || "");
  };

  const handleTitleSave = async () => {
    if (task && editedTitle !== task.title && editedTitle.trim()) {
      onUpdateTask({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDiscardChanges = () => {
    setEditedTitle(task?.title || "");
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      if (hasLocalUnsavedChanges()) {
        const shouldDiscard = window.confirm(
          "You have unsaved changes in title. Do you want to discard them?"
        );
        if (shouldDiscard) {
          handleDiscardChanges();
        }
      } else {
        handleDiscardChanges();
      }
    }
  };

  const handleBlur = () => {
    if (hasLocalUnsavedChanges()) {
      const shouldDiscard = window.confirm(
        "You have unsaved changes in title. Do you want to discard them?"
      );
      if (shouldDiscard) {
        handleDiscardChanges();
      } else {
        setTimeout(() => {
          const input = document.querySelector(
            'input[type="text"]'
          ) as HTMLInputElement;
          input?.focus();
        }, 0);
      }
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleClose = () => {
    if (hasLocalUnsavedChanges()) {
      const shouldDiscard = window.confirm(
        "You have unsaved changes in title. Do you want to discard them?"
      );
      if (shouldDiscard) {
        handleDiscardChanges();
        if (hasUnsavedChanges && onUnsavedChangesAlert) {
          onUnsavedChangesAlert();
        } else {
          onClose();
        }
      }
    } else if (hasUnsavedChanges && onUnsavedChangesAlert) {
      onUnsavedChangesAlert();
    } else {
      onClose();
    }
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-600">
      <div className="flex-1 mr-4">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleBlur}
              className="text-xl font-bold bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleTitleSave}
              className="p-2 text-green-400 hover:text-green-300 rounded"
            >
              <FaCheck className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-200">{task?.title}</h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditingTitle(true)}
              className="p-2 text-gray-400 hover:text-gray-200 rounded"
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
        className="p-2 text-gray-400 hover:text-gray-200 rounded"
      >
        <FaTimes className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default TaskHeader;

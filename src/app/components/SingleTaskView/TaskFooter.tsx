"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaClock, FaCalendarAlt } from "react-icons/fa";
import { TaskDetail, User } from "./types";
import { formatDate } from "./utils";

interface TaskFooterProps {
  /** Optional details of the task */
  task?: TaskDetail;

  /** Currently logged-in user */
  currentUser: User;

  /** Flag indicating if the task is new */
  isNewTask?: boolean;

  /** Flag indicating if there are unsaved changes */
  hasUnsavedChanges?: boolean;

  /** Flag indicating if the task is currently being saved */
  isSaving?: boolean;

  /** Callback function to save the task */
  onSave?: () => void;

  /** Callback function to close the task view */
  onClose?: () => void;
}

/**
 * Renders the footer of a task, displaying creation/update dates and task ID.
 */
const TaskFooter = ({ task, currentUser }: TaskFooterProps) => {
  return (
    <div className="border-t border-gray-600 p-2 bg-gray-800/50">
      <div className="text-[0.6rem] justify-evenly md:text-sm text-gray-400 flex flex-wrap items-center justify-start gap-2">
        <div className="flex items-center gap-1">
          <FaCalendarAlt className="w-2 h-2" />
          <span>
            Created{" "}
            {task ? formatDate(task.created_at || task.updated_at) : "N/A"}
          </span>
        </div>
        {task?.updated_at &&
          task.created_at &&
          task.updated_at !== task.created_at && (
            <div className="flex items-center gap-1">
              <FaClock className="w-2 h-2" />
              <span>Updated {formatDate(task.updated_at)}</span>
            </div>
          )}
      </div>
    </div>
  );
};

export default TaskFooter;

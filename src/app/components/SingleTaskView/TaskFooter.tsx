"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaClock, FaCalendarAlt } from "react-icons/fa";
import { TaskDetail, User } from "./types";
import { formatDate } from "./utils";

interface TaskFooterProps {
  task?: TaskDetail;
  currentUser: User;
  isNewTask?: boolean;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}

const TaskFooter = ({ task, currentUser }: TaskFooterProps) => {
  return (
    <div className="border-t border-gray-600 p-6 bg-gray-800/50">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="w-4 h-4" />
            <span>Created {task ? formatDate(task.created_at) : "N/A"}</span>
          </div>
          {task?.updated_at && task.updated_at !== task.created_at && (
            <div className="flex items-center gap-2">
              <FaClock className="w-4 h-4" />
              <span>Updated {formatDate(task.updated_at)}</span>
            </div>
          )}
        </div>
        <div className="text-xs">
          Task ID: {task ? task.id.slice(0, 8) : "N/A"}
        </div>
      </div>
    </div>
  );
};

export default TaskFooter;

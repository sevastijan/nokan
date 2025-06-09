import React, { useState, useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
  FiFlag,
  FiUser,
  FiCalendar,
  FiMessageCircle,
  FiPaperclip,
  FiMoreHorizontal,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button/Button";
import { Task as TaskType } from "../types/useBoardTypes";

interface TaskProps {
  task: TaskType;
  taskIndex: number;
  columnId: string;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string) => void;
  priorities?: Array<{ id: string; label: string; color: string }>;
}

interface MenuPosition {
  top: number;
  left?: number;
  right?: number;
}

/**
 * Truncate text to specified number of words
 */
const truncateText = (text: string, maxWords: number = 12): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
};

/**
 * Get priority info from priorities array
 */
const getPriorityInfo = (
  taskPriority: string | null | undefined,
  priorities: Array<{ id: string; label: string; color: string }> = []
) => {
  if (!taskPriority || !priorities.length) return null;
  const priority = priorities.find((p) => p.id === taskPriority);
  if (!priority) return null;

  // Enhanced priority config - użyj keyof typeof dla lepszego typowania
  const priorityConfigs: Record<
    string,
    {
      bgColor: string;
      textColor: string;
      borderColor: string;
    }
  > = {
    urgent: {
      bgColor: "bg-red-500/10",
      textColor: "text-red-300",
      borderColor: "border-red-500/30",
    },
    high: {
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-300",
      borderColor: "border-orange-500/30",
    },
    medium: {
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-300",
      borderColor: "border-yellow-500/30",
    },
    low: {
      bgColor: "bg-green-500/10",
      textColor: "text-green-300",
      borderColor: "border-green-500/30",
    },
  };

  const priorityKey = priority.label.toLowerCase();
  const config = priorityConfigs[priorityKey] || priorityConfigs.medium;

  return {
    color: priority.color || "#6B7280",
    label: priority.label || "Unknown",
    ...config,
  };
};

/**
 * Get user avatar URL or initials
 */
const getUserAvatar = (user: any) => {
  if (user?.image) return user.image;
  const initials =
    user?.name
      ?.split(" ")
      .map((name: string) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=4285f4&color=ffffff&size=32`;
};

/**
 * Enhanced Task component with professional design
 */
const Task = ({
  task,
  taskIndex,
  columnId,
  onRemoveTask,
  onOpenTaskDetail,
  priorities = [],
}: TaskProps): React.JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        if (isMenuOpen) setIsMenuOpen(false);
      }
    };

    if (showDeleteConfirm || isMenuOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [showDeleteConfirm, isMenuOpen]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const menuWidth = 200; // Zwiększona szerokość dla lepszego wyglądu
    const menuHeight = 120; // Zwiększona wysokość

    // Domyślnie umieść menu nad przyciskiem
    let top = rect.top + window.scrollY - menuHeight - 8;
    let left: number | undefined = rect.left + window.scrollX;
    let right: number | undefined;

    // Jeśli menu wyjdzie poza górną krawędź, umieść pod przyciskiem
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + 8;
    }

    // Jeśli menu wyjdzie poza prawą krawędź, wyrównaj do prawej
    if (rect.left + menuWidth > screenWidth) {
      left = undefined;
      right = screenWidth - rect.right + window.scrollX;
    }

    // Jeśli menu wyjdzie poza dolną krawędź, umieść nad przyciskiem
    if (top + menuHeight > window.scrollY + screenHeight) {
      top = rect.top + window.scrollY - menuHeight - 8;
    }

    setMenuPosition({ top, left, right });
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setIsMenuOpen(false), 150);
  };

  const handleMenuAction = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    event.preventDefault();
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    action();
    setIsMenuOpen(false);
  };

  const handleTaskClick = (event: React.MouseEvent) => {
    if (!isMenuOpen) onOpenTaskDetail(task.id);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onRemoveTask(columnId, task.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => setShowDeleteConfirm(false);

  const priorityInfo = getPriorityInfo(task.priority, priorities);

  return (
    <div className="group relative">
      {/* Task Card */}
      <div
        onClick={handleTaskClick}
        className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 rounded-xl p-4 shadow-lg hover:shadow-xl hover:border-slate-600/60 transition-all duration-300 cursor-pointer hover:bg-slate-800/80 relative"
      >
        {/* Task Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-100 font-semibold text-sm leading-snug mb-1 truncate">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-slate-400 text-xs leading-relaxed">
                {truncateText(task.description, 15)}
              </p>
            )}
          </div>

          {/* Three Dots Menu Button */}
          <button
            onClick={toggleMenu}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-slate-700/60 rounded-lg text-slate-400 hover:text-slate-200 ml-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Task Meta Information */}
        <div className="flex items-center justify-between">
          {/* Priority Badge */}
          {priorityInfo && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${priorityInfo.bgColor} ${priorityInfo.textColor} ${priorityInfo.borderColor}`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorityInfo.color }}
              />
              {priorityInfo.label}
            </div>
          )}

          {/* Assignee Avatar */}
          {task.assignee && (
            <div className="flex items-center gap-2">
              <img
                src={getUserAvatar(task.assignee)}
                alt={task.assignee.name || "User"}
                className="w-6 h-6 rounded-full border-2 border-slate-600/50"
              />
            </div>
          )}
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Context Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={handleMenuClose} />

          {/* Menu */}
          <div
            className="fixed z-50 bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 rounded-xl shadow-2xl py-2 min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              top: `${menuPosition.top}px`,
              left:
                menuPosition.left !== undefined
                  ? `${menuPosition.left}px`
                  : undefined,
              right:
                menuPosition.right !== undefined
                  ? `${menuPosition.right}px`
                  : undefined,
            }}
          >
            {/* Edit Task */}
            <button
              onClick={(e) =>
                handleMenuAction(e, () => onOpenTaskDetail(task.id))
              }
              className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700/60 transition-colors duration-150 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="font-medium">Edit Task</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-slate-700/50 my-1" />

            {/* Delete Task */}
            <button
              onClick={(e) => handleMenuAction(e, handleDelete)}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150 flex items-center gap-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span className="font-medium">Delete Task</span>
            </button>
          </div>
        </>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* Modal */}
            <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Delete Task
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-4">
                <p className="text-slate-300">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-slate-100">
                    "{task.title}"
                  </span>
                  ?
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-700/50">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-150 shadow-lg hover:shadow-xl"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Task;

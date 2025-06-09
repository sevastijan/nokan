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
    const menuWidth = 150;
    const menuHeight = 100;

    let top = rect.top + window.scrollY - 10;
    let left: number | undefined = rect.right + window.scrollX + 10;
    let right: number | undefined;

    if (rect.right + menuWidth + 10 > screenWidth) {
      left = undefined;
      right = screenWidth - rect.left + window.scrollX + 10;
    }

    if (rect.top + menuHeight > screenHeight) {
      top = rect.bottom + window.scrollY - menuHeight - 10;
    }

    if (screenWidth < 400) {
      left = screenWidth / 2 - menuWidth / 2;
      right = undefined;
    }

    setMenuPosition({ top, left, right });
    setIsMenuOpen((prev) => !prev);
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
    <>
      <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
            }}
            className={`bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4 cursor-pointer group ${
              snapshot.isDragging
                ? "shadow-2xl border-indigo-500/50 "
                : "hover:shadow-lg hover:border-slate-600/50 transition-all duration-200"
            }`}
            onClick={snapshot.isDragging ? undefined : handleTaskClick}
          >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-200 text-sm leading-relaxed group-hover:text-white transition-colors flex-1 pr-2">
                {truncateText(task.title, 8)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="!p-1.5 !text-slate-400 hover:!text-slate-200 hover:!bg-slate-700/50 !rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                icon={<FiMoreHorizontal className="w-4 h-4" />}
              />
            </div>

            {/* Task Description */}
            {task.description && (
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                {truncateText(task.description, 12)}
              </p>
            )}

            {/* Priority Badge */}
            {priorityInfo && (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 border ${priorityInfo.bgColor} ${priorityInfo.textColor} ${priorityInfo.borderColor}`}
              >
                <FiFlag
                  className="w-3 h-3"
                  style={{ color: priorityInfo.color }}
                />
                {priorityInfo.label}
              </div>
            )}

            {/* Task Footer */}
            <div className="flex items-center justify-between">
              {/* Task Metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {task.comments && task.comments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FiMessageCircle className="w-3 h-3" />
                    <span>{task.comments.length}</span>
                  </div>
                )}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FiPaperclip className="w-3 h-3" />
                    <span>{task.attachments.length}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Assignee Avatar */}
              <div className="flex items-center">
                {task.assignee ? (
                  <div className="relative">
                    <img
                      src={getUserAvatar(task.assignee)}
                      alt={task.assignee.name}
                      className="w-7 h-7 rounded-lg border-2 border-slate-600/50 hover:border-slate-500 transition-colors"
                    />
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </div>
                ) : task.user_id ? (
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 border border-slate-600/50 flex items-center justify-center">
                    <FiUser className="w-3 h-3 text-slate-400" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Enhanced Context Menu - tylko gdy nie dragging */}
            {isMenuOpen && !snapshot.isDragging && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="fixed z-50 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl py-2 min-w-[150px]"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  right: menuPosition.right,
                }}
                onMouseLeave={handleMenuClose}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) =>
                    handleMenuAction(e, () => onOpenTaskDetail(task.id))
                  }
                  className="w-full justify-start !text-slate-300 hover:!text-slate-100 hover:!bg-slate-700/50 !rounded-none !py-2 !px-4"
                >
                  Edit Task
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleMenuAction(e, handleDelete)}
                  className="w-full justify-start !text-red-400 hover:!text-red-300 hover:!bg-red-500/10 !rounded-none !py-2 !px-4"
                >
                  Delete Task
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </Draggable>

      {/* Enhanced Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-xl">
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
                <h3 className="text-slate-200 text-lg font-semibold">
                  Delete Task
                </h3>
              </div>

              <p className="text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-slate-200 font-medium">
                  "{truncateText(task.title, 6)}"
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelDelete}
                  className="!text-slate-400 hover:!text-slate-200 hover:!bg-slate-700/50"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={confirmDelete}
                  className="!bg-red-600 hover:!bg-red-700"
                >
                  Delete Task
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Task;

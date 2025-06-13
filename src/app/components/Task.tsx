// src/app/components/Task.tsx
"use client";

import React, { useState } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";

import { FiFlag, FiCalendar, FiMoreHorizontal } from "react-icons/fi";
import Button from "./Button/Button";
import Avatar from "./Avatar/Avatar";
import { Task as TaskType, User } from "@/app/types/globalTypes";
import {
  getPriorityStyleConfig,
  truncateText,
  useUserAvatar,
  formatDate,
} from "@/app/utils/helpers";

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

const Task = ({
  task,
  taskIndex,
  columnId,
  onRemoveTask,
  onOpenTaskDetail,
  priorities = [],
}: TaskProps): React.JSX.Element => {
  // State for menu visibility & position, delete confirmation
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0 });

  // Derive priority display: label + style config + dotColor
  let priorityDisplay: {
    label: string;
    style: ReturnType<typeof getPriorityStyleConfig>;
    dotColor: string;
  } | null = null;
  if (task.priority) {
    // Find matching priority item from props: use its label/color
    const pr = priorities.find((p) => p.id === task.priority);
    const styleConfig = getPriorityStyleConfig(task.priority);
    if (pr) {
      // Override dotColor if DB color exists
      const dotClr = pr.color || styleConfig.dotColor;
      priorityDisplay = {
        label: pr.label,
        style: styleConfig,
        dotColor: dotClr,
      };
    } else {
      // Fallback: use ID as label
      priorityDisplay = {
        label: task.priority,
        style: styleConfig,
        dotColor: styleConfig.dotColor,
      };
    }
  }

  // Assignee info: if task.assignee istnieje i jest typu User
  const assignee: User | null = task.assignee || null;

  // Use hook to get avatar URL, caching in Redux
  const avatarUrl = useUserAvatar(assignee);

  /**
   * Toggle menu: calculate position so it does not overflow screen.
   */
  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const menuWidth = 200;

    let top = rect.top + window.scrollY - 120 - 8;
    let left: number | undefined = rect.left + window.scrollX;
    let right: number | undefined;

    // If above viewport, place below button
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + 8;
    }
    // If overflows on right, adjust to right-align
    if (rect.left + menuWidth > screenWidth) {
      left = undefined;
      right = screenWidth - rect.right + window.scrollX;
    }

    setMenuPosition({ top, left, right });
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => setIsMenuOpen(false);

  const handleMenuAction = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    action();
    setIsMenuOpen(false);
  };

  const handleTaskClick = (event: React.MouseEvent) => {
    if (!isMenuOpen) {
      onOpenTaskDetail(task.id);
    }
  };

  // Delete confirmation handlers
  const handleDelete = () => {
    setIsMenuOpen(false);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = () => {
    onRemoveTask(columnId, task.id);
    setShowDeleteConfirm(false);
  };
  const cancelDelete = () => setShowDeleteConfirm(false);

  // Animation variants for Reorder.Item
  const cardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <Reorder.Item
      value={task}
      key={task.id}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <div
        onClick={handleTaskClick}
        className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-slate-600/60 transition-all duration-200 cursor-pointer hover:bg-slate-800/80 overflow-hidden"
      >
        {/* Title & menu button */}
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
          <button
            onClick={toggleMenu}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-slate-700/60 rounded-lg text-slate-400 hover:text-slate-200 ml-2 flex-shrink-0"
          >
            <FiMoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Priority badge & avatar */}
        <div className="flex items-center justify-between">
          {priorityDisplay && (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${priorityDisplay.style.bgColor} ${priorityDisplay.style.textColor} ${priorityDisplay.style.borderColor}`}
            >
              <FiFlag
                className="w-3 h-3"
                style={{ color: priorityDisplay.dotColor }}
              />
              <span>{priorityDisplay.label}</span>
            </div>
          )}
          {assignee && (
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-slate-600/50 overflow-hidden">
                <Avatar src={avatarUrl || ""} alt={assignee.name} size={32} />
              </div>
            </div>
          )}
        </div>

        {/* Due date display */}
        {task.due_date && (
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FiCalendar className="w-3.5 h-3.5" />
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Menu overlay */}
        {isMenuOpen && (
          <>
            {/* Backdrop to catch outside clicks */}
            <div className="fixed inset-0 z-40" onClick={handleMenuClose} />
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
              {/* View / Edit Task */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/60"
                onClick={(e) =>
                  handleMenuAction(e, () => onOpenTaskDetail(task.id))
                }
              >
                View / Edit Task
              </Button>
              <div className="h-px bg-slate-700/50 my-1" />
              {/* Delete Task */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={(e) => handleMenuAction(e, handleDelete)}
              >
                Delete Task
              </Button>
            </div>
          </>
        )}

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 rounded-2xl shadow-2xl max-w-md w-full mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                      {/* Trash icon */}
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
                <div className="px-6 pb-4">
                  <p className="text-slate-300">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-slate-100">
                      "{task.title}"
                    </span>
                    ?
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-700/50">
                  <Button variant="ghost" size="sm" onClick={cancelDelete}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={confirmDelete}>
                    Delete Task
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

export default Task;

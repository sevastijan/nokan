// src/app/components/Task.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMoreVertical, FiFlag, FiCalendar } from "react-icons/fi";
import Avatar from "./Avatar/Avatar";
import Button from "./Button/Button";
import { Task as TaskType, User } from "@/app/types/globalTypes";
import {
  getPriorityStyleConfig,
  truncateText,
  useUserAvatar,
} from "@/app/utils/helpers";

interface TaskProps {
  task: TaskType;
  taskIndex: number;
  columnId: string;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string) => void;
  priorities?: Array<{ id: string; label: string; color: string }>;
}

const Task = ({
  task,
  columnId,
  onRemoveTask,
  onOpenTaskDetail,
  priorities = [],
}: TaskProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Priorytet
  const prio =
    task.priority &&
    (() => {
      const cfg = getPriorityStyleConfig(task.priority!);
      const label =
        priorities.find((p) => p.id === task.priority)?.label || task.priority;
      const dotColor =
        priorities.find((p) => p.id === task.priority)?.color || cfg.dotColor;
      return { label, cfg, dotColor };
    })();

  // Assignee
  const assignee = (task.assignee as User) || null;
  const avatarUrl = useUserAvatar(assignee);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="
        glass-card p-4 relative
        cursor-pointer group
        hover:-translate-y-0.5
      "
      onClick={() => menuOpen || onOpenTaskDetail(task.id)}
    >
      {/* Menu */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(true);
        }}
        className="
          absolute top-2 right-2
          opacity-0 group-hover:opacity-100
          transition-opacity
        "
      >
        <FiMoreVertical size={16} />
      </button>

      {/* Tytuł i opis */}
      <h4 className="text-white font-semibold mb-1 truncate text-sm">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-gray-200 text-xs mb-3">
          {truncateText(task.description, 15)}
        </p>
      )}

      {/* Stopka: priorytet, data, avatar */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {prio && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${prio.cfg.bgColor} ${prio.cfg.textColor} ${prio.cfg.borderColor}
              `}
            >
              <FiFlag size={12} style={{ color: prio.dotColor }} />
              {prio.label}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1 text-xs text-gray-300">
              <FiCalendar size={12} />
              {new Date(task.due_date).toLocaleDateString("pl-PL", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </div>
        {assignee && avatarUrl && (
          <Avatar
            src={avatarUrl}
            alt={assignee.name}
            size={32}
            className="border-2 border-white"
          />
        )}
      </div>

      {/* Kontekstowe menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="
                absolute top-6 right-2 z-50
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-md shadow-lg overflow-hidden
              "
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  onOpenTaskDetail(task.id);
                  setMenuOpen(false);
                }}
              >
                View / Edit
              </Button>
              <div className="border-t border-gray-100 dark:border-gray-700" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900"
                onClick={() => {
                  setConfirmDel(true);
                  setMenuOpen(false);
                }}
              >
                Delete
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Potwierdzenie usunięcia */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-80"
            >
              <h4 className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
                Delete "{task.title}"?
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDel(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onRemoveTask(columnId, task.id)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Task;

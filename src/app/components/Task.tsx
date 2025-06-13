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
import { useState, useEffect } from "react";
import { Task as TaskType } from "../types/globalTypes";

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

const truncateText = (text: string, maxWords: number = 12): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.length <= maxWords
    ? text
    : words.slice(0, maxWords).join(" ") + "...";
};

const getPriorityInfo = (
  taskPriority: string | null | undefined,
  priorities: Array<{ id: string; label: string; color: string }>
) => {
  if (!taskPriority || !priorities.length) return null;
  const priority = priorities.find((p) => p.id === taskPriority);
  if (!priority) return null;

  const priorityConfigs: Record<
    string,
    { bgColor: string; textColor: string; borderColor: string }
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

const getUserAvatar = (user: { image?: string; name?: string }) => {
  if (user?.image) return user.image;
  const initials =
    user?.name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=4285f4&color=ffffff&size=32`;
};

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

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const menuWidth = 200;

    let top = rect.top + window.scrollY - 120 - 8;
    let left = rect.left + window.scrollX;
    let right: number | undefined;

    if (top < window.scrollY) top = rect.bottom + window.scrollY + 8;
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
  const assignee = task.user_id
    ? { id: task.user_id, name: task.assignee?.name || "Unknown" }
    : null; // Adjust based on schema

  return (
    <div className="group relative">
      <Draggable draggableId={task.id} index={taskIndex}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleTaskClick}
            className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 rounded-xl p-4 shadow-lg hover:shadow-xl hover:border-slate-600/60 transition-all duration-300 cursor-pointer hover:bg-slate-800/80 relative"
          >
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
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between">
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
              {assignee && (
                <div className="flex items-center gap-2">
                  <img
                    src={getUserAvatar(assignee)}
                    alt={assignee.name}
                    className="w-6 h-6 rounded-full border-2 border-slate-600/50"
                  />
                </div>
              )}
            </div>

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
        )}
      </Draggable>

      {isMenuOpen && (
        <>
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
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/60"
              onClick={(e) =>
                handleMenuAction(e, () => onOpenTaskDetail(task.id))
              }
              icon={
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
              }
            >
              Edit Task
            </Button>
            <div className="h-px bg-slate-700/50 my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={(e) => handleMenuAction(e, handleDelete)}
              icon={
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
              }
            >
              Delete Task
            </Button>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
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
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Task;

import React, { useState, useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { FaFlag } from "react-icons/fa";
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
 * @param {string} text - Text to truncate
 * @param {number} maxWords - Maximum number of words to show
 * @returns {string} Truncated text
 */
const truncateText = (text: string, maxWords: number = 12): string => {
  if (!text) return "";

  const words = text.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(" ") + "...";
};

/**
 * Get priority color based on priority level
 * @param {string} priority - Priority level
 * @returns {string} CSS class for priority color
 */
const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "text-red-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Get priority info from priorities array based on task priority
 * @param {string | null | undefined} taskPriority - Priority ID from task
 * @param {Array} priorities - Available priorities from database
 * @returns {object} Priority display info
 */
const getPriorityInfo = (
  taskPriority: string | null | undefined,
  priorities: Array<{ id: string; label: string; color: string }> = []
) => {
  if (!taskPriority || !priorities.length) return null;

  const priority = priorities.find((p) => p.id === taskPriority);

  if (!priority) return null;

  return {
    color: priority.color || "#6B7280",
    label: priority.label || "Unknown",
  };
};

/**
 * Get user avatar URL or initials
 * @param {any} user - User object containing name and image
 * @returns {string} Avatar URL or initials
 */
const getUserAvatar = (user: any) => {
  if (user?.image) {
    return user.image;
  }

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
 * Task component that displays a draggable task card with edit/delete menu
 * @param task - Task data including id, title, and description
 * @param taskIndex - Index of the task for drag and drop ordering
 * @param columnId - ID of the column containing this task
 * @param onRemoveTask - Function to handle task removal
 * @param onOpenTaskDetail - Function to open task detail view
 * @param priorities - Array of available priorities
 * @returns JSX element containing the task card interface
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
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Toggle context menu and calculate its position with mobile-friendly positioning
   * @param event - Mouse event from the menu button
   */
  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent opening task details

    const rect = event.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const menuWidth = 120;
    const menuHeight = 80;

    let top = rect.top + window.scrollY - 10;
    let left: number | undefined = rect.right + window.scrollX + 10;
    let right: number | undefined;

    if (rect.right + menuWidth + 10 > screenWidth) {
      left = undefined;
      right = screenWidth - rect.left + window.scrollX + 10;
    }

    // Check if menu would go off bottom of screen
    if (rect.top + menuHeight > screenHeight) {
      top = rect.bottom + window.scrollY - menuHeight - 10;
    }

    // For very small screens, center the menu
    if (screenWidth < 400) {
      left = screenWidth / 2 - menuWidth / 2;
      right = undefined;
    }

    setMenuPosition({ top, left, right });
    setIsMenuOpen((prev) => !prev);
  };

  /**
   * Handle menu close with debounce for mobile
   */
  const handleMenuClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 150);
  };

  /**
   * Handle menu action and close menu immediately
   */
  const handleMenuAction = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    event.preventDefault();

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    action();
    setIsMenuOpen(false);
  };

  /**
   * Handle task click - open detail only if not clicking menu items
   */
  const handleTaskClick = (event: React.MouseEvent) => {
    if (!isMenuOpen) {
      onOpenTaskDetail(task.id);
    }
  };

  /**
   * Handle task delete action
   */
  const handleDelete = () => {
    onRemoveTask(columnId, task.id);
  };

  const priorityInfo = getPriorityInfo(task.priority, priorities);

  return (
    <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? "0 4px 8px rgba(0, 0, 0, 0.2)"
              : "none",
          }}
          className={`bg-gray-700 text-white rounded-lg p-4 mb-2 cursor-pointer hover:bg-gray-600 transition-all duration-200 relative ${
            snapshot.isDragging ? "transform scale-105" : ""
          }`}
          onClick={handleTaskClick}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium leading-tight pr-2">
              {truncateText(task.title, 8)}
            </h3>
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-200 p-1 rounded transition-colors"
            >
              ⋮
            </button>
          </div>

          {task.description && (
            <p className="text-xs text-gray-300 mb-2">
              {truncateText(task.description, 12)}
            </p>
          )}

          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              {priorityInfo && (
                <div className="flex items-center gap-1">
                  <FaFlag
                    className="w-3 h-3"
                    style={{ color: priorityInfo.color }}
                  />
                  <span
                    style={{ color: priorityInfo.color }}
                    className="font-medium"
                  >
                    {priorityInfo.label}
                  </span>
                </div>
              )}
            </div>
            {task.assignee && (
              <img
                src={getUserAvatar(task.assignee)}
                alt={task.assignee.name}
                className="w-6 h-6 rounded-full"
              />
            )}
          </div>

          {/* Context Menu */}
          {isMenuOpen && (
            <div
              className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 min-w-[120px]"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                right: menuPosition.right,
              }}
              onMouseLeave={handleMenuClose}
            >
              <button
                onClick={(e) =>
                  handleMenuAction(e, () => onOpenTaskDetail(task.id))
                }
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={(e) => handleMenuAction(e, handleDelete)}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Task;

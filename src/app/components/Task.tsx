import { Draggable } from "@hello-pangea/dnd";
import { FaEllipsisV, FaFlag } from "react-icons/fa";
import { Task as TaskType } from "../types/useBoardTypes";
import { JSX, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskProps {
  task: TaskType;
  taskIndex: number;
  columnId: string;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskDetail: (taskId: string) => void;
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
 * @returns JSX element containing the task card interface
 */
const Task = ({
  task,
  taskIndex,
  columnId,
  onRemoveTask,
  onOpenTaskDetail,
}: TaskProps): JSX.Element => {
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
      left = rect.left + window.scrollX - menuWidth - 10;
      right = undefined;

      if (left < 10) {
        left = 10;
        right = undefined;
      }
    }

    // Check if menu would go off bottom of screen
    if (rect.top + menuHeight > screenHeight) {
      top = rect.bottom + window.scrollY - menuHeight + 10;
    }

    // For very small screens, center the menu
    if (screenWidth < 400) {
      left = (screenWidth - menuWidth) / 2;
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
    event.stopPropagation();

    const target = event.target as HTMLElement;
    if (
      target.closest(".task-menu") ||
      target.closest('button[aria-label="Task options"]')
    ) {
      return;
    }

    console.log("Opening task detail for:", task.id);
    onOpenTaskDetail(task.id);
  };

  /**
   * Handle task delete action
   */
  const handleDelete = () => {
    onRemoveTask(columnId, task.id);
  };

  return (
    <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleTaskClick}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-750 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <p className="font-semibold text-sm sm:text-base truncate text-gray-200">
                {task.title}
              </p>
            </div>
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200 p-1 flex-shrink-0"
              aria-label="Task options"
            >
              <FaEllipsisV size={16} />
            </button>
          </div>
          {task.description && (
            <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-3">
              {truncateText(task.description, 15)}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {task.priority && (
                <div className="flex items-center gap-1">
                  <FaFlag
                    size={12}
                    className={getPriorityColor(task.priority)}
                  />
                  <span
                    className={`text-xs capitalize ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>
              )}
            </div>
            {task.assignee && (
              <img
                src={getUserAvatar(task.assignee)}
                alt={task.assignee.name}
                className="w-6 h-6 rounded-full border border-gray-600"
              />
            )}
          </div>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="task-menu fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px]"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  right: menuPosition.right,
                }}
                onMouseLeave={handleMenuClose}
              >
                <button
                  onClick={(e) => handleMenuAction(e, handleDelete)}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded-lg transition-colors duration-150"
                >
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Draggable>
  );
};

export default Task;

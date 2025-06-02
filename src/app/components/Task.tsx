import { Draggable } from "@hello-pangea/dnd";
import { FaEllipsisV } from "react-icons/fa";
import { Task as TaskType } from "../types/useBoardTypes";
import { JSX, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskProps {
  task: TaskType;
  taskIndex: number;
  columnId: string;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskModal: (task: TaskType) => void;
  onOpenTaskDetail: (taskId: string) => void; // New prop
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
 * Task component that displays a draggable task card with edit/delete menu
 * @param task - Task data including id, title, and description
 * @param taskIndex - Index of the task for drag and drop ordering
 * @param columnId - ID of the column containing this task
 * @param onRemoveTask - Function to handle task removal
 * @param onOpenTaskModal - Function to open task edit modal
 * @param onOpenTaskDetail - Function to open task detail view
 * @returns JSX element containing the task card interface
 */
const Task = ({
  task,
  taskIndex,
  columnId,
  onRemoveTask,
  onOpenTaskModal,
  onOpenTaskDetail, // New prop
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
    const menuWidth = 120; // Approximate menu width
    const menuHeight = 80; // Approximate menu height

    let top = rect.top + window.scrollY - 10;
    let left: number | undefined = rect.right + window.scrollX + 10;
    let right: number | undefined;

    // Check if menu would go off right edge of screen
    if (rect.right + menuWidth + 10 > screenWidth) {
      // Position menu to the left of button instead
      left = rect.left + window.scrollX - menuWidth - 10;
      right = undefined;

      // If still off screen (very narrow), position relative to screen edge
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
  const handleMenuAction = (action: () => void) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    action();
    setIsMenuOpen(false);
  };

  /**
   * Handle task edit action
   */
  const handleEdit = () => {
    onOpenTaskModal(task);
  };

  /**
   * Handle task delete action
   */
  const handleDelete = () => {
    onRemoveTask(columnId, task.id);
  };

  /**
   * Handle task click to open detail view
   */
  const handleTaskClick = (e: React.MouseEvent) => {
    // Do not open details if menu is clicked or menu is open
    if (isMenuOpen) return;

    e.stopPropagation();
    onOpenTaskDetail(task.id);
  };

  return (
    <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenTaskDetail(task.id)}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-750 cursor-pointer"
        >
          <div className="flex-1 min-w-0 pr-2 overflow-hidden">
            <p className="font-semibold text-sm sm:text-base truncate">
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1 mb-2 line-clamp-3 overflow-hidden">
                {truncateText(task.description, 15)}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200 p-1"
              aria-label="Task options"
            >
              <FaEllipsisV size={16} />
            </button>
          </div>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px]"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  right: menuPosition.right,
                }}
                onMouseLeave={handleMenuClose}
              >
                <button
                  onClick={() => handleMenuAction(handleEdit)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors duration-150"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleMenuAction(handleDelete)}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded-b-lg transition-colors duration-150"
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

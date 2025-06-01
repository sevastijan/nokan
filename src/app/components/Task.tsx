import { Draggable } from "@hello-pangea/dnd";
import { FaEllipsisV } from "react-icons/fa";
import { Task as TaskType } from "../types/useBoardTypes";
import { JSX, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskProps {
  task: TaskType;
  taskIndex: number;
  columnId: string;
  onRemoveTask: (columnId: string, taskId: string) => void;
  onOpenTaskModal: (task: TaskType) => void;
}

/**
 * Task component that displays a draggable task card with edit/delete menu
 * @param task - Task data including id, title, and description
 * @param taskIndex - Index of the task for drag and drop ordering
 * @param columnId - ID of the column containing this task
 * @param onRemoveTask - Function to handle task removal
 * @param onOpenTaskModal - Function to open task edit modal
 * @returns JSX element containing the task card interface
 */
const Task = ({
  task,
  taskIndex,
  columnId,
  onRemoveTask,
  onOpenTaskModal,
}: TaskProps): JSX.Element => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  /**
   * Toggle context menu and calculate its position
   * @param event - Mouse event from the menu button
   */
  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + window.scrollY - 10,
      left: rect.right + window.scrollX + 10,
    });
    setIsMenuOpen((prev) => !prev);
  };

  /**
   * Handle task edit action
   */
  const handleEdit = () => {
    onOpenTaskModal(task);
    setIsMenuOpen(false);
  };

  /**
   * Handle task delete action
   */
  const handleDelete = () => {
    onRemoveTask(columnId, task.id);
    setIsMenuOpen(false);
  };

  return (
    <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-gray-700 text-white rounded-lg shadow-md p-3 flex justify-between items-center transition-transform duration-200 ${
            snapshot.isDragging ? "transform scale-105" : ""
          }`}
        >
          <div className="flex-1">
            <p className="font-semibold">{task.title}</p>
            {task.description && (
              <p className="text-sm text-gray-400">{task.description}</p>
            )}
          </div>
          <div>
            <button
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200"
              aria-label="Task options"
            >
              <FaEllipsisV size={16} />
            </button>
          </div>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  zIndex: 1000,
                }}
                className="bg-gray-800 text-white rounded-lg shadow-lg p-2"
              >
                <button
                  onClick={handleEdit}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded-md transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-700 rounded-md transition-colors duration-200"
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

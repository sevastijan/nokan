"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import PrioritySelector from "./TaskColumn/PrioritySelector";
import Image from "next/image";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  images?: string[];
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  task?: Task;
  columnId?: string;
  onAddTask?: (task: Omit<Task, "id"> | Task) => void;
  onUpdateTask?: (columnId: string, task: Task) => void;
}

/**
 * Modal component for adding or editing tasks with image upload functionality
 * @param isOpen - Whether the modal is visible
 * @param onClose - Function to close the modal
 * @param mode - Modal mode (add or edit)
 * @param task - Task data when in edit mode
 * @param columnId - Column ID for task updates
 * @param onAddTask - Function to handle new task creation
 * @param onUpdateTask - Function to handle task updates
 * @returns JSX element containing the task modal interface
 */
const TaskModal = ({
  isOpen,
  onClose,
  mode,
  task,
  columnId,
  onAddTask,
  onUpdateTask,
}: TaskModalProps) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [images, setImages] = useState<string[]>(task?.images || []);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  /**
   * Update form fields when mode or task changes
   */
  useEffect(() => {
    if (mode === "add") {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setImages([]);
    } else if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "Medium");
      setImages(task.images || []);
    }
  }, [mode, task]);

  /**
   * Handle keyboard events (ESC to close, Enter to save)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        triggerClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (title.trim() && !loading) {
          handleSave();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, title, loading]);

  /**
   * Handle image upload and create object URLs for preview
   * @param event - File input change event
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const uploadedImages = Array.from(event.target.files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages([...images, ...uploadedImages]);
    }
  };

  /**
   * Handle saving task (add or update based on mode)
   */
  const handleSave = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!title.trim()) return;

    setLoading(true);

    try {
      if (mode === "add" && onAddTask) {
        onAddTask({ id: "", title, description, priority });
      } else if (mode === "edit" && onUpdateTask && task && columnId) {
        onUpdateTask(columnId, {
          ...task,
          title,
          description,
          priority,
        } as Task);
      }

      setLoading(false);
      triggerClose();
    } catch (error) {
      console.error("Error saving task:", error);
      setLoading(false);
    }
  };

  /**
   * Trigger modal close with animation
   */
  const triggerClose = () => {
    if (isClosing) return; // Prevent multiple close triggers
    setIsClosing(true);
    // The modal will close automatically via AnimatePresence exit animation
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  /**
   * Handle clicks outside the modal to close it
   * @param e - Mouse event from the backdrop
   */
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      triggerClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && !isClosing && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gray-800 text-white rounded-lg p-3 sm:p-4 w-full max-w-xs sm:max-w-sm mx-4 overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              height: isPriorityDropdownOpen ? "auto" : "auto",
              maxHeight: isPriorityDropdownOpen ? "95vh" : "90vh",
            }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-semibold">
                {mode === "add" ? "Add New Task" : "Edit Task"}
              </h2>
              <button
                onClick={triggerClose}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors duration-200 group"
                title="Close modal (ESC)"
              >
                <IoClose className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Task Title:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Enter task title"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Description:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>
              <div
                className={`transition-all duration-300 ${
                  isPriorityDropdownOpen ? "pb-32" : "pb-0"
                }`}
              >
                <PrioritySelector
                  selectedPriority={priority}
                  onChange={setPriority}
                  onDropdownToggle={setIsPriorityDropdownOpen}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={triggerClose}
                className="w-full sm:w-auto bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave(e);
                }}
                disabled={!title.trim() || loading}
                className="w-full sm:w-auto bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm order-1 sm:order-2"
                title="Cmd/Ctrl + Enter to save quickly"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-400 text-center opacity-30">
              <span>ESC to close • Cmd/Ctrl + Enter to save</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrioritySelector from "./PrioritySelector";
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
    setIsClosing(true);
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gray-800 text-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Task Title:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              {/* Priority selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={triggerClose}
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 order-2 sm:order-1"
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
                className="w-full sm:w-auto bg-blue-500 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;

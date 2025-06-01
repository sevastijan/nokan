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
  onAddTask?: (newTask: Task) => void;
  onUpdateTask?: (updatedTask: Task) => void;
}

/**
 * Modal component for adding or editing tasks with image upload functionality
 * @param isOpen - Whether the modal is visible
 * @param onClose - Function to close the modal
 * @param mode - Modal mode (add or edit)
 * @param task - Task data when in edit mode
 * @param onAddTask - Function to handle new task creation
 * @param onUpdateTask - Function to handle task updates
 * @returns JSX element containing the task modal interface
 */
const TaskModal = ({
  isOpen,
  onClose,
  mode,
  task,
  onAddTask,
  onUpdateTask,
}: TaskModalProps) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [images, setImages] = useState<string[]>(task?.images || []);
  const [isClosing, setIsClosing] = useState(false);

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
  const handleSave = () => {
    if (mode === "add" && onAddTask) {
      onAddTask({ id: "", title, description, priority, images });
    } else if (mode === "edit" && onUpdateTask) {
      onUpdateTask({ ...task, title, description, priority, images } as Task);
    }
    triggerClose();
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
      {isOpen && !isClosing && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50"
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gray-900 text-white rounded-lg p-6 w-full max-w-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4">
              {mode === "add" ? "Add New Task" : "Edit Task"}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-2">Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="Task Title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">
                  Description:
                </label>
                <textarea
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <PrioritySelector
                selectedPriority={priority}
                onChange={setPriority}
              />
              <div>
                <label className="block text-lg font-medium mb-2">
                  Upload Images:
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
                />
                <div className="mt-4 flex flex-wrap gap-4">
                  {images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Uploaded ${index}`}
                      width={128}
                      height={128}
                      className="object-cover rounded-lg border border-gray-600"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={triggerClose}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!title.trim()}
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;

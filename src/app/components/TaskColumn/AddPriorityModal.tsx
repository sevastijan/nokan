"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { addPriority } from "../../lib/api";

interface AddPriorityModalProps {
  onClose: () => void;
  onAddPriority: (priority: {
    id: string;
    label: string;
    color: string;
  }) => void;
}

/**
 * Modal component for adding new priority levels to tasks
 * @param onClose - Function to close the modal
 * @param onAddPriority - Function to handle new priority creation
 * @returns JSX element containing the add priority modal interface
 */
const AddPriorityModal = ({
  onClose,
  onAddPriority,
}: AddPriorityModalProps) => {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  /**
   * Handle saving a new priority
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      toast.error("Priority name is required");
      return;
    }

    setLoading(true);
    try {
      const newPriority = {
        id: Date.now().toString(),
        label: label.trim(),
        color,
      };

      await onAddPriority(newPriority);
      onClose();
    } catch (error) {
      // Error toast is handled in parent component
      console.error("Error adding priority:", error);
    } finally {
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
      {!isClosing && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50"
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gray-900 text-white rounded-lg p-6 w-full max-w-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4">Add New Priority</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-lg font-medium mb-2">Label:</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="Priority Name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-lg font-medium mb-2">Color:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 border border-gray-600 rounded-lg"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={triggerClose}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!label.trim() || loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPriorityModal;

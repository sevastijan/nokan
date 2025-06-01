import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useState, useEffect } from "react";

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  onDelete?: () => void;
  initialTitle?: string;
  title?: string;
  mode?: "create" | "edit" | "delete";
}

/**
 * Modal component for board operations (create, edit, delete)
 * @param isOpen - Whether the modal is open
 * @param onClose - Function to close the modal
 * @param onSubmit - Function to handle form submission
 * @param onDelete - Function to handle board deletion
 * @param initialTitle - Initial title value for edit mode
 * @param title - Modal title for create mode
 * @param mode - Modal mode (create, edit, delete)
 * @returns JSX element containing the modal interface
 */
const BoardModal = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialTitle = "",
  title = "Add Board",
  mode = "create",
}: BoardModalProps) => {
  const [input, setInput] = useState(initialTitle);
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission
   * @param e - Form event
   */
  const handleSave = () => {
    if (input.trim()) {
      setLoading(true);
      onSubmit(input.trim());
      setLoading(false);
      setInput("");
    }
  };

  /**
   * Update input when initialTitle or modal state changes
   */
  useEffect(() => {
    setInput(initialTitle);
  }, [initialTitle, isOpen]);

  /**
   * Handle outside click to close modal
   * @param e - Mouse event
   */
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
            className="bg-gray-800 text-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-4"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {mode === "create" ? "Create New Board" : "Edit Board"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Board Title:
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Enter board title"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!input.trim() || loading}
                className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {loading ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoardModal;

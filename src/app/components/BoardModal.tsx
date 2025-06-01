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

  /**
   * Handle form submission
   * @param e - Form event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "delete") {
      onDelete?.();
    } else if (input.trim()) {
      onSubmit(input.trim());
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
   * Get modal title based on mode
   * @returns Modal title string
   */
  const getTitle = () => {
    switch (mode) {
      case "edit":
        return "Edit Board";
      case "delete":
        return "Delete Board";
      default:
        return title;
    }
  };

  /**
   * Get submit button text based on mode
   * @returns Submit button text
   */
  const getSubmitText = () => {
    switch (mode) {
      case "edit":
        return "Save";
      case "delete":
        return "Delete";
      default:
        return "Save";
    }
  };

  /**
   * Get submit button CSS classes based on mode
   * @returns CSS class string
   */
  const getSubmitButtonClass = () => {
    return mode === "delete"
      ? "px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
      : "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md relative"
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 40 }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <FiX size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-4">{getTitle()}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "delete" ? (
                <p className="text-gray-300">
                  Are you sure you want to delete board "{initialTitle}"? This
                  action cannot be undone.
                </p>
              ) : (
                <input
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  placeholder="Board title"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button type="submit" className={getSubmitButtonClass()}>
                  {getSubmitText()}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoardModal;

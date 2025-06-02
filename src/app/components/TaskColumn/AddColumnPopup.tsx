import { motion, AnimatePresence } from "framer-motion";

interface AddColumnPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: () => void;
  newColumnTitle: string;
  setNewColumnTitle: (title: string) => void;
  isAddingColumn: boolean;
}

/**
 * Popup component for adding new columns to a board
 * @param isOpen - Whether the popup is visible
 * @param onClose - Function to close the popup
 * @param onAddColumn - Function to handle column creation
 * @param newColumnTitle - Current value of the column title input
 * @param setNewColumnTitle - Function to update the column title input
 * @param isAddingColumn - Whether a column is currently being added
 * @returns JSX element containing the add column popup interface
 */
const AddColumnPopup = ({
  isOpen,
  onClose,
  onAddColumn,
  newColumnTitle,
  setNewColumnTitle,
  isAddingColumn,
}: AddColumnPopupProps) => {
  /**
   * Handle Enter key press to submit the form
   * @param e - Keyboard event from the input field
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddingColumn && newColumnTitle.trim()) {
      onAddColumn();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gray-800 p-6 rounded-lg w-96 cursor-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Add New Column
            </h2>
            <input
              type="text"
              placeholder="Column title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-600 rounded px-3 py-2 mb-4 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onAddColumn}
                disabled={isAddingColumn || !newColumnTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isAddingColumn ? "Adding..." : "Add Column"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddColumnPopup;

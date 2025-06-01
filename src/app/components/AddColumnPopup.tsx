import { motion, AnimatePresence } from "framer-motion";

interface AddColumnPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: () => void;
  newColumnTitle: string;
  setNewColumnTitle: (title: string) => void;
  isAddingColumn: boolean;
}

const AddColumnPopup = ({
  isOpen,
  onClose,
  onAddColumn,
  newColumnTitle,
  setNewColumnTitle,
  isAddingColumn,
}: AddColumnPopupProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddingColumn && newColumnTitle.trim()) {
      onAddColumn();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gray-800 p-6 rounded-lg shadow-lg w-[350px]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
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
              className="w-full border border-gray-600 rounded px-3 py-2 mb-4 bg-gray-700 text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onAddColumn}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all duration-200"
                disabled={isAddingColumn || !newColumnTitle.trim()}
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

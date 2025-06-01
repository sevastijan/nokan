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
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddingColumn && newColumnTitle.trim()) {
      onAddColumn();
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
    >
      <div className="bg-white p-6 rounded shadow-lg w-[300px]">
        <h2 className="text-lg font-bold mb-4">Add New Column</h2>
        <input
          type="text"
          placeholder="Column title"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border rounded px-2 py-1 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onAddColumn}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={isAddingColumn || !newColumnTitle.trim()}
          >
            {isAddingColumn ? "Adding..." : "Add Column"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddColumnPopup;

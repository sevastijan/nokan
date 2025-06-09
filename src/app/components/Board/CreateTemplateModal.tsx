import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiTrash2, FiMove } from "react-icons/fi";
import { addBoardTemplate } from "../../lib/api";
import { CreateTemplateModalProps } from "./types";

interface TemplateColumn {
  id: string;
  title: string;
  order: number;
}

/**
 * Modal component for creating a new board template
 *
 * @param {boolean} isOpen - Determines whether the modal is visible
 * @param {() => void} onClose - Function called when modal is closed
 * @param {() => void} onTemplateCreated - Callback triggered after template creation
 */
const CreateTemplateModal = ({
  isOpen,
  onClose,
  onTemplateCreated,
}: CreateTemplateModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [columns, setColumns] = useState<TemplateColumn[]>([
    { id: "1", title: "To Do", order: 0 },
    { id: "2", title: "In Progress", order: 1 },
    { id: "3", title: "Done", order: 2 },
  ]);
  const [loading, setLoading] = useState(false);

  /**
   * Adds a new column to the template
   */
  const addColumn = () => {
    const newColumn: TemplateColumn = {
      id: Date.now().toString(),
      title: `Kolumna ${columns.length + 1}`,
      order: columns.length,
    };
    setColumns([...columns, newColumn]);
  };

  /**
   * Removes a column from the template
   *
   * @param {string} id - ID of the column to remove
   */
  const removeColumn = (id: string) => {
    if (columns.length <= 1) {
      alert("Szablon musi mieć przynajmniej jedną kolumnę");
      return;
    }
    setColumns(columns.filter((col) => col.id !== id));
  };

  /**
   * Updates the title of a column
   *
   * @param {string} id - ID of the column
   * @param {string} title - New title for the column
   */
  const updateColumnTitle = (id: string, title: string) => {
    setColumns(columns.map((col) => (col.id === id ? { ...col, title } : col)));
  };

  /**
   * Saves the template to the database
   */
  const handleSave = async () => {
    if (!name.trim()) {
      alert("Nazwa szablonu jest wymagana");
      return;
    }

    if (columns.some((col) => !col.title.trim())) {
      alert("Wszystkie kolumny muszą mieć nazwę");
      return;
    }

    setLoading(true);
    try {
      await addBoardTemplate({
        name: name.trim(),
        description: description.trim(),
        columns: columns.map((col, index) => ({
          title: col.title.trim(),
          order: index,
        })),
      });

      onTemplateCreated();
      handleClose();
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Nie udało się utworzyć szablonu");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Closes the modal and resets the form
   */
  const handleClose = () => {
    setName("");
    setDescription("");
    setColumns([
      { id: "1", title: "To Do", order: 0 },
      { id: "2", title: "In Progress", order: 1 },
      { id: "3", title: "Done", order: 2 },
    ]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Utwórz nowy szablon</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nazwa szablonu *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="np. Development Workflow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Opis szablonu
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Krótki opis szablonu..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Kolumny *</label>
                  <button
                    onClick={addColumn}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FiPlus size={16} />
                    Dodaj kolumnę
                  </button>
                </div>

                <div className="space-y-2">
                  {columns.map((column, index) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-3 bg-gray-700 rounded-lg p-3"
                    >
                      <FiMove className="text-gray-400" />
                      <span className="text-sm text-gray-400 w-8">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={column.title}
                        onChange={(e) =>
                          updateColumnTitle(column.id, e.target.value)
                        }
                        className="flex-1 bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="Nazwa kolumny"
                      />
                      <button
                        onClick={() => removeColumn(column.id)}
                        disabled={columns.length <= 1}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Zapisywanie..." : "Utwórz szablon"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateTemplateModal;

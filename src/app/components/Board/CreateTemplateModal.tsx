"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiPlus, FiTrash2, FiX, FiMove } from "react-icons/fi";
import { BoardTemplate } from "@/app/types/globalTypes";
import {
  getBoardTemplates,
  deleteBoardTemplate,
  addBoardTemplate,
} from "@/app/lib/api";
import { CreateTemplateModalProps } from "@/app/types/globalTypes";
interface TemplateColumn {
  id: string;
  title: string;
  order: number;
}

/**
 * Modal component for creating a new board template
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

  const addColumn = () => {
    const newColumn: TemplateColumn = {
      id: Date.now().toString(),
      title: `Kolumna ${columns.length + 1}`,
      order: columns.length,
    };
    setColumns((prev) => [...prev, newColumn]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) {
      alert("Szablon musi mieć przynajmniej jedną kolumnę");
      return;
    }
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const updateColumnTitle = (id: string, title: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, title } : col))
    );
  };

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
      // Call API to create template, returns BoardTemplate including id, template_columns, etc.
      const created: BoardTemplate = await addBoardTemplate({
        name: name.trim(),
        description: description.trim() || null,
        columns: columns.map((col, index) => ({
          title: col.title.trim(),
          order: index,
        })),
      });
      // Inform parent with newly created template
      onTemplateCreated(created);
      handleClose();
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Nie udało się utworzyć szablonu");
    } finally {
      setLoading(false);
    }
  };

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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            className="bg-slate-800 text-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Utwórz nowy szablon</h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            {/* Body */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nazwa szablonu *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="np. Development Workflow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Opis szablonu
                </label>
                <textarea
                  value={description || ""}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                      className="flex items-center gap-3 bg-slate-700 rounded-lg p-3"
                    >
                      <FiMove className="text-slate-400" />
                      <span className="text-sm text-slate-400 w-8">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={column.title}
                        onChange={(e) =>
                          updateColumnTitle(column.id, e.target.value)
                        }
                        className="flex-1 bg-slate-600 text-white border border-slate-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            {/* Footer */}
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

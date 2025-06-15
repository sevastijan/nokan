import { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import TemplateSelector from "@/app/components/Board/TemplateSelector";
import CreateTemplateModal from "@/app/components/Board/CreateTemplateModal";
import { BoardTemplate } from "@/app/types/globalTypes";

/**
 * Animated Board modal for create/edit/delete flows, with template support.
 */
const BoardModal = ({
  isOpen,
  mode,
  initialTitle = "",
  onClose,
  onSave,
  onDelete,
  selectedTemplate,
  onTemplateSelect,
  templateRefreshTrigger,
}: {
  isOpen: boolean;
  mode: "create" | "edit" | "delete";
  initialTitle?: string;
  boardId?: string;
  onClose: () => void;
  onSave: (title: string, templateId?: string | null) => Promise<void>;
  onDelete?: () => Promise<void>;
  selectedTemplate?: BoardTemplate | null;
  onTemplateSelect?: (tpl: BoardTemplate | null) => void;
  templateRefreshTrigger?: number;
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const templateSelectorRef = useRef<{ refreshTemplates: () => void }>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);
  useEffect(() => {
    if (mode === "create" && templateSelectorRef.current) {
      templateSelectorRef.current.refreshTemplates();
    }
  }, [templateRefreshTrigger, mode]);

  const handleSaveClick = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      alert("Board title is required");
      return;
    }
    try {
      if (mode === "create") {
        await onSave(trimmed, selectedTemplate?.id ?? null);
      } else if (mode === "edit") {
        await onSave(trimmed);
      }
    } catch (err) {
      console.error("BoardModal onSave error:", err);
    }
  };

  const handleDeleteClick = async () => {
    if (onDelete) {
      try {
        await onDelete();
      } catch (err) {
        console.error("BoardModal onDelete error:", err);
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-slate-800 text-white rounded-lg p-6 w-full max-w-md max-h-[90vh] h-auto"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {mode === "create"
                    ? "Create new board"
                    : mode === "edit"
                    ? "Edit board"
                    : "Delete board"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                {(mode === "create" || mode === "edit") && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Board title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter title..."
                    />
                  </div>
                )}

                {mode === "create" && onTemplateSelect && (
                  <TemplateSelector
                    ref={templateSelectorRef}
                    selectedTemplate={selectedTemplate || undefined}
                    onTemplateSelect={onTemplateSelect}
                    onCreateTemplate={() => setShowCreateTemplateModal(true)}
                    disabled={false}
                    refreshTrigger={templateRefreshTrigger || 0}
                  />
                )}

                {mode === "delete" && (
                  <p className="text-red-400">
                    Are you sure you want to delete this board?
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                {mode === "delete" && onDelete ? (
                  <button
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={handleSaveClick}
                    disabled={!title.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mode === "create" ? "Create" : "Save"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onTemplateCreated={(newTpl) => {
          templateSelectorRef.current?.refreshTemplates();
          onTemplateSelect?.(newTpl);
          setShowCreateTemplateModal(false);
        }}
      />
    </>
  );
};

export default BoardModal;

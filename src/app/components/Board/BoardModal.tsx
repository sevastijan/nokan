import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import TemplateSelector from "./TemplateSelector";
import CreateTemplateModal from "./CreateTemplateModal";
import { BoardTemplate, DEFAULT_TEMPLATES } from "@/app/types/globalTypes";
import { getBoardTemplates } from "../../lib/api";

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, template?: BoardTemplate) => void;
  onDelete?: () => void;
  initialTitle?: string;
  title?: string;
  mode?: "create" | "edit" | "delete";
}

/**
 * Modal component for board operations (create, edit, delete)
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
  const [selectedTemplate, setSelectedTemplate] =
    useState<BoardTemplate | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const templateSelectorRef = useRef<{ refreshTemplates: () => void }>(null);

  /**
   * Load default template when opening modal in create mode
   */
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      if (mode === "create" && isOpen && !selectedTemplate) {
        try {
          const templates = await getBoardTemplates();
          const basicTemplate = templates.find(
            (t) => t.name === "Basic Kanban"
          );
          if (basicTemplate) {
            setSelectedTemplate(basicTemplate);
          }
        } catch (error) {
          console.error("Error loading templates:", error);
        }
      }
    };

    loadDefaultTemplate();
  }, [mode, isOpen, selectedTemplate]);

  /**
   * Handle form submission
   */
  const handleSave = async () => {
    if (input.trim()) {
      setLoading(true);
      try {
        await onSubmit(
          input.trim(),
          mode === "create" ? selectedTemplate || undefined : undefined
        );
        setInput("");
        setSelectedTemplate(null);
      } catch (error) {
        console.error("Error saving:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Handle board deletion
   */
  const handleDelete = async () => {
    if (onDelete) {
      setLoading(true);
      try {
        await onDelete();
      } catch (error) {
        console.error("Error deleting:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Refresh template list after creating a new one
   */
  const handleTemplateCreated = async () => {
    setShowCreateTemplate(false);
    // Refresh templates via ref
    if (templateSelectorRef.current) {
      templateSelectorRef.current.refreshTemplates();
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
   */
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
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
                {mode === "create" && "Create New Board"}
                {mode === "edit" && "Edit Board"}
                {mode === "delete" && "Delete Board"}
              </h2>

              <div className="space-y-4">
                {mode === "delete" ? (
                  <div className="text-center">
                    <p className="text-gray-300 mb-2">
                      Are you sure you want to delete this board?
                    </p>
                    <p className="text-white font-semibold">"{initialTitle}"</p>
                    <p className="text-red-400 text-xs mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                ) : (
                  <>
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

                    {/* Template Selector - only for create mode */}
                    {mode === "create" && (
                      <TemplateSelector
                        ref={templateSelectorRef}
                        selectedTemplate={selectedTemplate}
                        onTemplateSelect={setSelectedTemplate}
                        onCreateTemplate={() => setShowCreateTemplate(true)}
                        disabled={loading}
                      />
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer duration-200 order-2 sm:order-1"
                >
                  Cancel
                </button>

                {mode === "delete" ? (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full sm:w-auto cursor-pointer bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!input.trim() || loading}
                    className="w-full sm:w-auto cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  >
                    {loading
                      ? "Saving..."
                      : mode === "create"
                      ? "Create"
                      : "Save"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        onTemplateCreated={handleTemplateCreated}
      />
    </>
  );
};

export default BoardModal;

"use client";

import { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import TemplateSelector from "@/app/components/Board/TemplateSelector";
import CreateTemplateModal from "@/app/components/Board/CreateTemplateModal";
import { BoardTemplate } from "@/app/types/globalTypes";

interface BoardModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "delete";
  initialTitle?: string;
  boardId?: string;
  onClose: () => void;
  /**
   * onSave:
   *  - if mode==="create": parent should handle creation, ideally signature: (title: string, templateId?: string | null) => Promise<void>
   *  - if mode==="edit": parent should handle updating existing board title: signature: (title: string) => Promise<void>
   */
  onSave: (title: string, templateId?: string | null) => Promise<void>;
  // onDelete: only in delete mode
  onDelete?: () => Promise<void>;

  // Template selector props (only relevant in create mode)
  selectedTemplate?: BoardTemplate | null;
  onTemplateSelect?: (tpl: BoardTemplate | null) => void;
  templateRefreshTrigger?: number;
}

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
}: BoardModalProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  // Whenever initialTitle changes (e.g. editing a different board), sync local state
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // Reference to TemplateSelector, to call refreshTemplates()
  const templateSelectorRef = useRef<{ refreshTemplates: () => void }>(null);

  // When opening in create mode, or when parent signals refreshTrigger change, reload templates
  useEffect(() => {
    if (mode === "create" && templateSelectorRef.current) {
      templateSelectorRef.current.refreshTemplates();
    }
  }, [templateRefreshTrigger, mode]);

  const handleSaveClick = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      alert("Tytuł jest wymagany");
      return;
    }

    try {
      if (mode === "create") {
        // Pass selectedTemplate?.id if any
        await onSave(trimmed, selectedTemplate?.id ?? null);
      } else if (mode === "edit") {
        await onSave(trimmed);
      }
      // Optionally parent closes modal after onSave resolves
    } catch (err) {
      console.error("BoardModal onSave error:", err);
      // Optionally show notification/toast
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

  // Prevent background scroll when modal is open (optional)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    // Don't render modal markup if not open
    return null;
  }

  return (
    <>
      {/* Backdrop + modal container */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-white rounded-lg p-6 w-full max-w-md max-h-[90vh] h-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {mode === "create"
                ? "Utwórz nową tablicę"
                : mode === "edit"
                ? "Edytuj tablicę"
                : "Usuń tablicę"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4">
            {(mode === "create" || mode === "edit") && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Nazwa tablicy
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Wprowadź tytuł..."
                />
              </div>
            )}

            {mode === "create" && onTemplateSelect && (
              <TemplateSelector
                ref={templateSelectorRef}
                selectedTemplate={selectedTemplate || undefined}
                onTemplateSelect={onTemplateSelect}
                onCreateTemplate={() => {
                  setShowCreateTemplateModal(true);
                }}
                disabled={false}
                refreshTrigger={templateRefreshTrigger || 0}
              />
            )}

            {mode === "delete" && (
              <p className="text-red-400">
                Czy na pewno chcesz usunąć tę tablicę?
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Anuluj
            </button>

            {mode === "delete" && onDelete ? (
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Usuń
              </button>
            ) : (
              <button
                onClick={handleSaveClick}
                disabled={!title.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === "create" ? "Utwórz" : "Zapisz"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onTemplateCreated={(newTpl) => {
          // After creation, refresh the TemplateSelector list
          if (templateSelectorRef.current) {
            templateSelectorRef.current.refreshTemplates();
          }
          // Optionally auto-select the newly created template
          onTemplateSelect?.(newTpl);
          setShowCreateTemplateModal(false);
        }}
      />
    </>
  );
};

export default BoardModal;

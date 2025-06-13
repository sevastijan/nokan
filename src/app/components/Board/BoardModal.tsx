"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import DOMPurify from "dompurify";
import TemplateSelector from "@/app/components/Board/TemplateSelector";
import { BoardTemplate } from "@/app/types/globalTypes";

interface BoardModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "delete";
  initialTitle?: string;
  boardId?: string;
  onClose: () => void;
  onSave: (title: string, templateId?: string | null) => void;
  onDelete: () => void;
}

const BoardModal: React.FC<BoardModalProps> = ({
  isOpen,
  mode,
  initialTitle = "",
  boardId,
  onClose,
  onSave,
  onDelete,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [selectedTemplate, setSelectedTemplate] =
    useState<BoardTemplate | null>(null);
  const [refreshTemplatesTrigger, setRefreshTemplatesTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset stanu przy otwarciu lub zmianie trybu:
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setError(null);
      if (mode === "create") {
        setSelectedTemplate(null);
        // wymuś odświeżenie selectorów:
        setRefreshTemplatesTrigger((prev) => prev + 1);
      }
    }
  }, [isOpen, mode, initialTitle]);

  // Zamknięcie ESC i klik poza:
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (mode === "create") {
      if (!title.trim()) {
        setError("Podaj nazwę tablicy.");
        return;
      }
      const safeTitle = DOMPurify.sanitize(title.trim());
      onSave(safeTitle, selectedTemplate?.id || null);
    } else if (mode === "edit") {
      if (!title.trim()) {
        setError("Podaj nazwę tablicy.");
        return;
      }
      const safeTitle = DOMPurify.sanitize(title.trim());
      onSave(safeTitle, null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative transform overflow-visible rounded-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {mode === "create"
                ? "Utwórz nową tablicę"
                : mode === "edit"
                ? "Edytuj tablicę"
                : "Usuń tablicę"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {mode === "delete" ? (
              <p className="text-white">
                Czy na pewno chcesz usunąć tę tablicę?
              </p>
            ) : (
              <>
                {/* Tytuł */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-white">
                    Nazwa tablicy
                  </label>
                  <input
                    type="text"
                    placeholder="Wprowadź tytuł..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                {/* Wybór szablonu tylko przy tworzeniu */}
                {mode === "create" && (
                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={setSelectedTemplate}
                    onCreateTemplate={() => {
                      // opcjonalnie: otwórz modal tworzenia szablonu
                      console.log("Create template callback");
                    }}
                    disabled={false}
                    refreshTrigger={refreshTemplatesTrigger}
                  />
                )}
                {error && <div className="text-red-400 text-sm">{error}</div>}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 px-6 py-4 border-t border-slate-700/50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500"
            >
              Anuluj
            </button>
            {mode === "delete" ? (
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                Usuń
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!title.trim()}
              >
                {mode === "create" ? "Utwórz" : "Zapisz"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardModal;

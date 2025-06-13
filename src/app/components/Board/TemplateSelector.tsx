// src/app/components/TemplateSelector.tsx
"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiPlus, FiTrash2 } from "react-icons/fi";
import { BoardTemplate } from "@/app/types/globalTypes";
import { getBoardTemplates, deleteBoardTemplate } from "@/app/lib/api";
import { TemplateSelectorProps } from "@/app/types/globalTypes";

const TemplateSelector = forwardRef<
  { refreshTemplates: () => void },
  TemplateSelectorProps
>(
  (
    {
      selectedTemplate,
      onTemplateSelect,
      onCreateTemplate,
      disabled = false,
      refreshTrigger = 0,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [templates, setTemplates] = useState<BoardTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTemplates = await getBoardTemplates();
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error("Error loading templates:", err);
        setError("Nie udało się załadować szablonów");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refreshTemplates: loadTemplates,
    }));

    useEffect(() => {
      loadTemplates();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    const handleDeleteTemplate = async (
      templateId: string,
      e: React.MouseEvent
    ) => {
      e.stopPropagation();
      if (!confirm("Czy na pewno chcesz usunąć ten szablon?")) return;
      try {
        await deleteBoardTemplate(templateId);
        await loadTemplates();
        if (selectedTemplate?.id === templateId) {
          onTemplateSelect(null);
        }
      } catch (err) {
        console.error("Error deleting template:", err);
        setError("Usuwanie nie powiodło się");
      }
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Szablon tablicy
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 text-sm flex items-center justify-between hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">
              {loading
                ? "Ładowanie..."
                : error
                ? "Błąd"
                : selectedTemplate?.name || "Wybierz szablon"}
            </span>
            {selectedTemplate && !error && (
              <span className="text-xs text-gray-400 mt-1">
                {selectedTemplate.description}
              </span>
            )}
          </div>
          <FiChevronDown
            className={`transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {error && (
          <div className="mt-1 text-red-400 text-xs text-center">{error}</div>
        )}

        <AnimatePresence>
          {isOpen && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <button
                onClick={() => {
                  onCreateTemplate();
                  setIsOpen(false);
                }}
                className="w-full p-3 text-left hover:bg-slate-600 transition-colors border-b border-slate-600 flex items-center gap-2 text-blue-400"
              >
                <FiPlus size={16} />
                <div>
                  <div className="font-medium">Utwórz nowy szablon</div>
                  <div className="text-xs text-gray-400">
                    Dostosuj własny układ kolumn
                  </div>
                </div>
              </button>

              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 hover:bg-slate-600 transition-colors cursor-pointer flex items-center justify-between ${
                    selectedTemplate?.id === template.id ? "bg-slate-600" : ""
                  }`}
                  onClick={() => {
                    onTemplateSelect(template);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {template.name}
                      {!template.is_custom && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          Domyślny
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Kolumny:{" "}
                      {template.template_columns
                        .map((c) => c.title)
                        .join(", ") || "Brak"}
                    </div>
                  </div>
                  {template.is_custom && (
                    <button
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {templates.length === 0 && (
                <div className="p-3 text-gray-400 text-center">
                  Brak szablonów
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

TemplateSelector.displayName = "TemplateSelector";
export default TemplateSelector;

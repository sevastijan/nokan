import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiPlus, FiTrash2 } from "react-icons/fi";
import { BoardTemplate } from "@/app/types/globalTypes";
import { getBoardTemplates, deleteBoardTemplate } from "../../lib/api";
import { TemplateSelectorProps } from "./types";

/**
 * Dropdown component for selecting a board template.
 * Supports loading, selecting, creating, and deleting templates.
 *
 * @param selectedTemplate - Currently selected template
 * @param onTemplateSelect - Callback triggered on template selection
 * @param onCreateTemplate - Callback triggered when creating a new template
 * @param disabled - Whether the selector is disabled
 * @param refreshTrigger - Changes to this prop will trigger reloading templates
 * @returns JSX.Element
 */
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
      } catch (error) {
        console.error("Error loading templates:", error);
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refreshTemplates: loadTemplates,
    }));

    useEffect(() => {
      loadTemplates();
    }, [refreshTrigger]);

    const handleDeleteTemplate = async (
      templateId: string,
      e: React.MouseEvent
    ) => {
      e.stopPropagation();

      if (!confirm("Are you sure you want to delete this template?")) {
        return;
      }

      try {
        await deleteBoardTemplate(templateId);
        await loadTemplates();

        if (selectedTemplate?.id === templateId) {
          onTemplateSelect(templates[0] || null); // Fallback to null if no templates remain
        }
      } catch (error) {
        console.error("Error deleting template:", error);
        setError("Failed to delete the template");
      }
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Select template:
        </label>

        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 flex items-center justify-between hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">
              {loading
                ? "Loading..."
                : error
                ? "Error loading templates"
                : selectedTemplate?.name || "Select a template"}
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
          <div className="mt-2 text-red-400 text-xs text-center">{error}</div>
        )}

        <AnimatePresence>
          {isOpen && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              <button
                onClick={() => {
                  onCreateTemplate();
                  setIsOpen(false);
                }}
                className="w-full p-3 text-left hover:bg-gray-600 transition-colors border-b border-gray-600 flex items-center gap-2 text-blue-400"
              >
                <FiPlus size={16} />
                <div>
                  <div className="font-medium">Create new template</div>
                  <div className="text-xs text-gray-400">
                    Customize your own board template
                  </div>
                </div>
              </button>

              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 hover:bg-gray-600 transition-colors cursor-pointer flex items-center justify-between ${
                    selectedTemplate?.id === template.id ? "bg-gray-600" : ""
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
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Columns:{" "}
                      {template.template_columns
                        .map((col) => col.title)
                        .join(", ") || "None"}
                    </div>
                  </div>

                  {template.is_custom && (
                    <button
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

              {templates.length === 0 && (
                <div className="p-3 text-gray-400 text-center">
                  No templates available
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

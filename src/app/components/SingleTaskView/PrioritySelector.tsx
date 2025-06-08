"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaFlag,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  getPriorities,
  addPriority,
  updatePriority,
  deletePriority,
} from "../../lib/api";
import { PrioritySelectorProps, Priority } from "./types";
import { useDropdownManager } from "../../hooks/useDropdownManager";

/**
 * PrioritySelector component allows user to select a priority from a dropdown list.
 * It fetches priorities from an API if not provided externally, supports loading state,
 * and calls callbacks on selection change and dropdown toggle.
 * Users can add, edit, and delete custom priorities.
 */
const PrioritySelector = ({
  selectedPriority,
  onChange,
  onDropdownToggle,
  priorities: externalPriorities,
}: PrioritySelectorProps) => {
  // Generate unique ID for this dropdown instance
  const dropdownId = useMemo(
    () => `priority-selector-${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const { isOpen, toggle, close } = useDropdownManager(dropdownId);

  /** Stores list of priorities to display */
  const [priorities, setPriorities] = useState<Priority[]>([]);
  /** Indicates whether priorities are being loaded */
  const [loading, setLoading] = useState(true);
  /** Controls add new priority mode */
  const [isAddingNew, setIsAddingNew] = useState(false);
  /** Stores ID of priority being edited */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Form data for new/edited priority */
  const [formData, setFormData] = useState({ label: "", color: "#10b981" });
  /** Loading state for operations */
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    /** Loads priorities from external prop or API, falls back to defaults on error */
    const loadPriorities = async () => {
      try {
        if (externalPriorities) {
          setPriorities(externalPriorities);
          setLoading(false);
        } else {
          const fetchedPriorities = await getPriorities();
          setPriorities(fetchedPriorities);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading priorities:", error);
        const defaultPriorities = [
          { id: "low", label: "Low", color: "#10b981" },
          { id: "medium", label: "Medium", color: "#f59e0b" },
          { id: "high", label: "High", color: "#ef4444" },
          { id: "urgent", label: "Urgent", color: "#dc2626" },
        ];
        setPriorities(defaultPriorities);
        setLoading(false);
      }
    };

    loadPriorities();
  }, [externalPriorities]);

  // Reset forms when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setIsAddingNew(false);
      setEditingId(null);
      setFormData({ label: "", color: "#10b981" });
    }
  }, [isOpen]);

  // Notify parent component when dropdown toggles
  useEffect(() => {
    onDropdownToggle?.(isOpen);
  }, [isOpen, onDropdownToggle]);

  /** Finds the selected priority object from the list - memoized for better performance */
  const selectedPriorityObj = useMemo(() => {
    if (!selectedPriority) return null;
    return priorities.find((p) => p.id === selectedPriority) || null;
  }, [priorities, selectedPriority]);

  /** Toggles dropdown open state */
  const handleToggle = () => {
    toggle();
  };

  /** Handles selection of a priority: updates state and calls change callback */
  const handlePrioritySelect = (priority: Priority) => {
    if (typeof onChange === "function") {
      onChange(priority.id);
    }
    close();
  };

  /** Clears selected priority, closes dropdown, and calls change callback */
  const handleClearPriority = () => {
    if (typeof onChange === "function") {
      onChange(null);
    }
    close();
  };

  /** Starts adding new priority mode */
  const handleStartAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({ label: "", color: "#10b981" });
  };

  /** Starts editing existing priority */
  const handleStartEdit = (priority: Priority) => {
    setEditingId(priority.id);
    setIsAddingNew(false);
    setFormData({ label: priority.label, color: priority.color });
  };

  /** Saves new or edited priority */
  const handleSavePriority = async () => {
    if (!formData.label.trim() || operationLoading) return;

    setOperationLoading(true);
    try {
      if (isAddingNew) {
        const newPriority = await addPriority(
          formData.label.trim(),
          formData.color
        );
        setPriorities((prev) => [...prev, newPriority]);
      } else if (editingId) {
        const updatedPriority = await updatePriority(
          editingId,
          formData.label.trim(),
          formData.color
        );
        setPriorities((prev) =>
          prev.map((p) => (p.id === editingId ? updatedPriority : p))
        );

        // Force re-render by updating state if this priority is currently selected
        if (selectedPriority === editingId) {
          onChange?.(selectedPriority);
        }
      }

      // Reset form
      setIsAddingNew(false);
      setEditingId(null);
      setFormData({ label: "", color: "#10b981" });
    } catch (error) {
      console.error("Error saving priority:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Error saving priority: ${errorMessage}`);
    } finally {
      setOperationLoading(false);
    }
  };

  /** Cancels add/edit mode */
  const handleCancelEdit = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({ label: "", color: "#10b981" });
  };

  /** Deletes a priority */
  const handleDeletePriority = async (priorityId: string) => {
    if (operationLoading) return;

    if (!confirm("Are you sure you want to delete this priority?")) {
      return;
    }

    setOperationLoading(true);
    try {
      await deletePriority(priorityId);
      setPriorities((prev) => prev.filter((p) => p.id !== priorityId));

      if (selectedPriority === priorityId) {
        onChange?.(null);
      }
    } catch (error) {
      console.error("Error deleting priority:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("being used by")) {
        alert(
          "Cannot delete this priority because it's being used by one or more tasks. Please remove it from all tasks first."
        );
      } else {
        alert(`Error deleting priority: ${errorMessage}`);
      }
    } finally {
      setOperationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Priority
        </label>
        <div className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-400">
          Loading priorities...
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Priority
      </label>
      <motion.button
        type="button"
        whileHover={{ backgroundColor: "#374151" }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedPriorityObj ? (
            <>
              <FaFlag
                className="w-4 h-4"
                style={{ color: selectedPriorityObj.color }}
              />
              <span>{selectedPriorityObj.label}</span>
            </>
          ) : (
            <>
              <FaFlag className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Select priority</span>
            </>
          )}
        </div>
        <FaChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            <motion.button
              type="button"
              whileHover={{ backgroundColor: "#4B5563" }}
              onClick={handleClearPriority}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors border-b border-gray-600"
            >
              <FaFlag className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">No priority</span>
            </motion.button>

            {priorities.map((priority) => (
              <div key={priority.id} className="relative group">
                {editingId === priority.id ? (
                  <div className="p-3 border-b border-gray-600 bg-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            label: e.target.value,
                          }))
                        }
                        className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-500 rounded text-white"
                        placeholder="Priority name"
                        disabled={operationLoading}
                      />
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="w-8 h-8 rounded border border-gray-500"
                        disabled={operationLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePriority}
                        disabled={operationLoading || !formData.label.trim()}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 rounded text-white transition-colors"
                      >
                        <FaCheck className="w-3 h-3" />
                        {operationLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={operationLoading}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 disabled:opacity-50 rounded text-white transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center border-b border-gray-600 last:border-b-0">
                    <motion.div
                      whileHover={{ backgroundColor: "#4B5563" }}
                      onClick={() =>
                        !operationLoading && handlePrioritySelect(priority)
                      }
                      className="flex-1 flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                      <FaFlag
                        className="w-4 h-4"
                        style={{ color: priority.color }}
                      />
                      <span className="text-gray-200 flex-1">
                        {priority.label}
                      </span>
                      {selectedPriorityObj?.id === priority.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </motion.div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(priority);
                        }}
                        disabled={operationLoading}
                        className="p-1 text-blue-400 cursor-pointer hover:text-blue-300 disabled:opacity-50 transition-colors"
                      >
                        <FaEdit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePriority(priority.id);
                        }}
                        disabled={operationLoading}
                        className="p-1 text-red-400 hover:text-red-300 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isAddingNew ? (
              <div className="p-3 bg-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-500 rounded text-white"
                    placeholder="Priority name"
                    disabled={operationLoading}
                  />
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded border border-gray-500"
                    disabled={operationLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePriority}
                    disabled={operationLoading || !formData.label.trim()}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 rounded text-white transition-colors"
                  >
                    <FaCheck className="w-3 h-3" />
                    {operationLoading ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={operationLoading}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 disabled:opacity-50 rounded text-white transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ backgroundColor: "#4B5563" }}
                onClick={handleStartAddNew}
                disabled={operationLoading}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors text-blue-400 hover:text-blue-300 disabled:opacity-50 rounded-b-lg"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add new priority</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrioritySelector;

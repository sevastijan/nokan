"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "@/app/lib/api";
import { PrioritySelectorProps, Priority } from "@/app/types/globalTypes";
import { useDropdownManager } from "@/app/hooks/useDropdownManager";

/**
 * PrioritySelector:
 * Dropdown for selecting, adding, editing, and deleting priorities (e.g. Low, Medium, High).
 * - Uses priorities from props if provided, otherwise fetches via API.
 * - Supports custom priority creation & editing in dropdown.
 * - Notifies parent on value change or dropdown open/close.
 */
const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onChange,
  onDropdownToggle,
  priorities: externalPriorities,
}) => {
  // Unique dropdown ID (for focus management, etc.)
  const dropdownId = useMemo(
    () => `priority-selector-${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const { isOpen, toggle, close } = useDropdownManager(dropdownId);

  // Priority list state (either fetched or from props)
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State for add/edit forms
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ label: string; color: string }>({
    label: "",
    color: "#10b981",
  });
  const [operationLoading, setOperationLoading] = useState<boolean>(false);

  // Load priorities from API or props on mount or prop change
  useEffect(() => {
    const load = async () => {
      try {
        if (externalPriorities) {
          setPriorities(externalPriorities);
        } else {
          const fetched = await getPriorities();
          setPriorities(fetched);
        }
      } catch (err) {
        console.error("Error loading priorities:", err);
        // Fallback to default priorities if fetch fails
        setPriorities([
          { id: "low", label: "Low", color: "#10b981" },
          { id: "medium", label: "Medium", color: "#f59e0b" },
          { id: "high", label: "High", color: "#ef4444" },
          { id: "urgent", label: "Urgent", color: "#dc2626" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [externalPriorities]);

  // Reset form state when dropdown closes, notify parent of open/close state
  useEffect(() => {
    if (!isOpen) {
      setIsAddingNew(false);
      setEditingId(null);
      setFormData({ label: "", color: "#10b981" });
    }
    // Optionally inform parent about open/close
    onDropdownToggle?.(isOpen);
  }, [isOpen, onDropdownToggle]);

  // Find the currently selected priority object
  const selectedObj = useMemo<Priority | null>(() => {
    if (!selectedPriority) return null;
    return priorities.find((p) => p.id === selectedPriority) || null;
  }, [selectedPriority, priorities]);

  // Select a priority (calls parent)
  const handleSelect = (p: Priority) => {
    onChange(p.id);
    close();
  };
  // Clear selection (no priority)
  const handleClear = () => {
    onChange(null);
    close();
  };
  // Start add new priority form
  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({ label: "", color: "#10b981" });
  };
  // Start editing an existing priority
  const handleStartEdit = (p: Priority) => {
    setEditingId(p.id);
    setIsAddingNew(false);
    setFormData({ label: p.label, color: p.color });
  };
  // Cancel add/edit mode
  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({ label: "", color: "#10b981" });
  };
  // Save new or edited priority (API call)
  const handleSave = async () => {
    if (!formData.label.trim()) return;
    setOperationLoading(true);
    try {
      if (isAddingNew) {
        const newP = await addPriority(formData.label.trim(), formData.color);
        setPriorities((prev) => [...prev, newP]);
      } else if (editingId) {
        const upd = await updatePriority(
          editingId,
          formData.label.trim(),
          formData.color
        );
        setPriorities((prev) =>
          prev.map((p) => (p.id === editingId ? upd : p))
        );
        // If user is editing currently selected priority, trigger onChange
        if (selectedPriority === editingId) {
          onChange(editingId);
        }
      }
      // Reset form
      setIsAddingNew(false);
      setEditingId(null);
      setFormData({ label: "", color: "#10b981" });
    } catch (err) {
      console.error("Error saving priority:", err);
      alert(
        "Error saving priority: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setOperationLoading(false);
    }
  };
  // Delete a priority (API call)
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this priority?")) return;
    setOperationLoading(true);
    try {
      await deletePriority(id);
      setPriorities((prev) => prev.filter((p) => p.id !== id));
      if (selectedPriority === id) {
        onChange(null);
      }
    } catch (err: any) {
      console.error("Error deleting priority:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("being used")) {
        alert("Cannot delete: priority is used by existing tasks.");
      } else {
        alert("Error deleting priority: " + msg);
      }
    } finally {
      setOperationLoading(false);
    }
  };

  // Show loading skeleton if priorities not loaded yet
  if (loading) {
    return (
      <div className="relative">
        <label className="block text-sm text-slate-300 mb-1">Priority</label>
        <div className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-slate-400">
          Loading priorities...
        </div>
      </div>
    );
  }

  // --- MAIN DROPDOWN RENDER ---
  return (
    <div className="relative w-full">
      <label className="block text-sm text-slate-300 mb-1">Priority</label>
      {/* Dropdown button */}
      <button
        type="button"
        onClick={toggle}
        className={`
          w-full flex items-center justify-between px-3 py-2 
          bg-slate-700 border rounded-lg text-slate-200 
          transition-colors duration-150
          ${
            isOpen
              ? "border-purple-500 ring-1 ring-purple-500"
              : "border-slate-600 hover:border-slate-500"
          }
        `}
      >
        {/* Selected priority preview */}
        <div className="flex items-center gap-2 truncate">
          {selectedObj ? (
            <>
              <FaFlag
                className="w-4 h-4"
                style={{ color: selectedObj.color }}
              />
              <span className="truncate">{selectedObj.label}</span>
            </>
          ) : (
            <>
              <FaFlag className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 truncate">Select priority</span>
            </>
          )}
        </div>
        <FaChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown list (animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {/* Option for "no priority" */}
            <button
              type="button"
              onClick={handleClear}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-left 
                hover:bg-slate-700 transition-colors duration-150
                ${selectedObj === null ? "bg-purple-600/30" : ""}
              `}
            >
              <FaTimes className="w-4 h-4 text-slate-400" />
              <span className="text-slate-200">No priority</span>
            </button>

            <hr className="border-slate-600 my-1" />

            {/* If no priorities exist */}
            {priorities.length === 0 && (
              <div className="px-3 py-2 text-slate-400 text-sm text-center">
                No priorities available
              </div>
            )}

            {/* Priority list */}
            {priorities.map((p) => {
              const isSel = selectedObj?.id === p.id;
              const editing = editingId === p.id;
              return (
                <div key={p.id} className="relative group">
                  {editing ? (
                    // Edit mode
                    <div className="p-3 bg-slate-700 border-b border-slate-600">
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, label: e.target.value }))
                        }
                        className="w-full mb-2 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                        placeholder="Name"
                        disabled={operationLoading}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              color: e.target.value,
                            }))
                          }
                          className="w-8 h-8 rounded border border-slate-500"
                          disabled={operationLoading}
                        />
                        <FaFlag
                          className="w-4 h-4"
                          style={{ color: formData.color }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={!formData.label.trim() || operationLoading}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white text-xs rounded"
                        >
                          <FaCheck className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={operationLoading}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs rounded"
                        >
                          <FaTimes className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Default (select/edit/delete) mode
                    <div className="flex items-center border-b border-slate-600 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 text-left 
                          hover:bg-slate-700 transition-colors duration-150
                          ${isSel ? "bg-purple-600/30" : ""}
                        `}
                      >
                        <FaFlag
                          className="w-4 h-4"
                          style={{ color: p.color }}
                        />
                        <span className="text-slate-200 truncate">
                          {p.label}
                        </span>
                      </button>
                      {/* Edit & delete icons (only visible on hover) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(p);
                          }}
                          disabled={operationLoading}
                          className="p-1 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          disabled={operationLoading}
                          className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add new priority form/button */}
            {isAddingNew ? (
              <div className="p-3 bg-slate-700 border-t border-slate-600">
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, label: e.target.value }))
                  }
                  className="w-full mb-2 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  placeholder="New priority name"
                  disabled={operationLoading}
                />
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, color: e.target.value }))
                    }
                    className="w-8 h-8 rounded border border-slate-500"
                    disabled={operationLoading}
                  />
                  <FaFlag
                    className="w-4 h-4"
                    style={{ color: formData.color }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!formData.label.trim() || operationLoading}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white text-xs rounded"
                  >
                    <FaPlus className="w-3 h-3" />
                    Add
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={operationLoading}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs rounded"
                  >
                    <FaTimes className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartAdd}
                disabled={operationLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors duration-150"
              >
                <FaPlus className="w-4 h-4" />
                <span className="text-sm">Add new priority</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrioritySelector;

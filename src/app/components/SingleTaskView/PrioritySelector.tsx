"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFlag } from "react-icons/fa";
import { getPriorities } from "../../lib/api";

interface Priority {
  /** Unique identifier of the priority */
  id: string;
  /** Display label of the priority */
  label: string;
  /** Color code used to represent the priority */
  color: string;
}

interface PrioritySelectorProps {
  /** Currently selected priority ID, or null/undefined if none */
  selectedPriority: string | null | undefined;
  /** Callback invoked when priority changes, passing the new priority ID or null */
  onChange: (priority: string | null) => void;
  /** Optional callback triggered when dropdown toggles open/close */
  onDropdownToggle?: (isOpen: boolean) => void;
  /** Optional externally provided list of priorities */
  priorities?: Priority[];
}

/**
 * PrioritySelector component allows user to select a priority from a dropdown list.
 * It fetches priorities from an API if not provided externally, supports loading state,
 * and calls callbacks on selection change and dropdown toggle.
 */
const PrioritySelector = ({
  selectedPriority,
  onChange,
  onDropdownToggle,
  priorities: externalPriorities,
}: PrioritySelectorProps) => {
  /** Controls dropdown open/close state */
  const [isOpen, setIsOpen] = useState(false);
  /** Stores list of priorities to display */
  const [priorities, setPriorities] = useState<Priority[]>([]);
  /** Indicates whether priorities are being loaded */
  const [loading, setLoading] = useState(true);

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

  /** Finds the selected priority object from the list */
  const selectedPriorityObj = priorities.find((p) => {
    if (!selectedPriority) return false;
    return p.id === selectedPriority;
  });

  /** Toggles dropdown open state and invokes optional toggle callback */
  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onDropdownToggle?.(newIsOpen);
  };

  /** Handles selection of a priority: updates state and calls change callback */
  const handlePrioritySelect = (priority: Priority) => {
    if (typeof onChange === "function") {
      onChange(priority.id);
    }
    setIsOpen(false);
    onDropdownToggle?.(false);
  };

  /** Clears selected priority, closes dropdown, and calls change callback */
  const handleClearPriority = () => {
    if (typeof onChange === "function") {
      onChange(null);
    }
    setIsOpen(false);
    onDropdownToggle?.(false);
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
            className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg"
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
              <motion.button
                key={priority.id}
                type="button"
                whileHover={{ backgroundColor: "#4B5563" }}
                onClick={() => handlePrioritySelect(priority)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors last:rounded-b-lg"
              >
                <FaFlag className="w-4 h-4" style={{ color: priority.color }} />
                <span className="text-gray-200">{priority.label}</span>
                {selectedPriorityObj?.id === priority.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrioritySelector;

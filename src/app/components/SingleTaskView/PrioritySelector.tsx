"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFlag } from "react-icons/fa";
import { getPriorities } from "../../lib/api";

interface Priority {
  id: string;
  label: string;
  color: string;
}

interface PrioritySelectorProps {
  selectedPriority: string | null | undefined;
  onChange: (priority: string | null) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
  priorities?: Priority[];
}

const PrioritySelector = ({
  selectedPriority,
  onChange,
  onDropdownToggle,
  priorities: externalPriorities,
}: PrioritySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const selectedPriorityObj = priorities.find((p) => {
    if (!selectedPriority) return false;
    return p.id === selectedPriority;
  });

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onDropdownToggle?.(newIsOpen);
  };

  const handlePrioritySelect = (priority: Priority) => {
    if (typeof onChange === "function") {
      onChange(priority.id);
    }
    setIsOpen(false);
    onDropdownToggle?.(false);
  };

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

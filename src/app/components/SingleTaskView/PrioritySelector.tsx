"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaFlag } from "react-icons/fa";
import { Priority } from "./types";

interface PrioritySelectorProps {
  selectedPriority: Priority | null;
  availablePriorities: Priority[];
  onPrioritySelect: (priorityId: string) => Promise<void>;
  label: string;
}

const PrioritySelector = ({
  selectedPriority,
  availablePriorities,
  onPrioritySelect,
  label,
}: PrioritySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrioritySelect = async (priorityId: string) => {
    await onPrioritySelect(priorityId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <motion.button
        whileHover={{ backgroundColor: "#374151" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedPriority ? (
            <>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedPriority.color }}
              ></div>
              <span>{selectedPriority.label}</span>
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
            {availablePriorities.map((priority) => (
              <motion.button
                key={priority.id}
                whileHover={{ backgroundColor: "#4B5563" }}
                onClick={() => handlePrioritySelect(priority.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: priority.color }}
                ></div>
                <span className="text-gray-200">{priority.label}</span>
                {selectedPriority?.id === priority.id && (
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

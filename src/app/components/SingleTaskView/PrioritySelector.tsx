"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFlag, FaCheck, FaChevronDown } from "react-icons/fa";
import { Priority } from "./types";

interface PrioritySelectorProps {
  selectedPriority?: Priority;
  availablePriorities: Priority[];
  onPrioritySelect: (priorityId: string) => void;
  label: string;
}

/**
 * Priority selector component with color indicators
 */
const PrioritySelector = ({
  selectedPriority,
  availablePriorities,
  onPrioritySelect,
  label,
}: PrioritySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const PriorityBadge = ({ priority }: { priority: Priority }) => (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: priority.color }}
      />
      <span className="text-sm text-gray-200">{priority.label}</span>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <label className="w-32 text-sm font-medium text-gray-300 flex-shrink-0">
          {label}
        </label>

        {selectedPriority ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors min-w-[200px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaFlag
              style={{ color: selectedPriority.color }}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-200 flex-1">
              {selectedPriority.label}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="text-gray-400"
            >
              <FaChevronDown className="w-3 h-3" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-500 min-w-[200px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaFlag className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400 flex-1">No priority</span>
            <FaChevronDown className="w-3 h-3 text-gray-400" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-32 mt-2 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-50 min-w-[220px]"
            >
              <div className="p-2">
                <motion.div
                  whileHover={{ backgroundColor: "#4b5563" }}
                  className="flex items-center gap-3 p-3 rounded cursor-pointer"
                  onClick={() => {
                    onPrioritySelect("");
                    setIsOpen(false);
                  }}
                >
                  <FaFlag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300 flex-1">
                    No priority
                  </span>
                  {!selectedPriority && (
                    <FaCheck className="w-4 h-4 text-green-500" />
                  )}
                </motion.div>

                {availablePriorities.map((priority) => (
                  <motion.div
                    key={priority.id}
                    whileHover={{ backgroundColor: "#4b5563" }}
                    className="flex items-center gap-3 p-3 rounded cursor-pointer"
                    onClick={() => {
                      onPrioritySelect(priority.id);
                      setIsOpen(false);
                    }}
                  >
                    <FaFlag
                      style={{ color: priority.color }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-200 flex-1">
                      {priority.label}
                    </span>
                    {selectedPriority?.id === priority.id && (
                      <FaCheck className="w-4 h-4 text-green-500" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrioritySelector;

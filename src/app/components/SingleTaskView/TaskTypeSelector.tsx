"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaCheckSquare, FaLayerGroup } from "react-icons/fa";
import { TaskType } from "@/app/types/globalTypes";
import { useDropdownManager } from "@/app/hooks/useDropdownManager";

interface TaskTypeSelectorProps {
  selectedType: TaskType;
  onChange: (type: TaskType) => void;
  disabled?: boolean;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const TASK_TYPES: { value: TaskType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    value: "task",
    label: "Task",
    icon: <FaCheckSquare className="w-4 h-4" />,
    description: "A simple task without subtasks",
    color: "blue",
  },
  {
    value: "story",
    label: "Story",
    icon: <FaLayerGroup className="w-4 h-4" />,
    description: "A task that can contain subtasks",
    color: "purple",
  },
];

const TaskTypeSelector: React.FC<TaskTypeSelectorProps> = ({
  selectedType,
  onChange,
  disabled = false,
}) => {
  const dropdownId = useMemo(
    () => `task-type-selector-${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const { isOpen, toggle, close } = useDropdownManager(dropdownId);

  const selectedOption = TASK_TYPES.find((t) => t.value === selectedType) || TASK_TYPES[0];

  const handleSelect = (type: TaskType) => {
    onChange(type);
    close();
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm text-slate-300 mb-1">Type</label>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2
          bg-slate-700 border rounded-lg text-slate-200
          transition-colors duration-150
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            isOpen
              ? selectedOption.color === "blue"
                ? "border-blue-500 ring-1 ring-blue-500"
                : "border-purple-500 ring-1 ring-purple-500"
              : "border-slate-600 hover:border-slate-500"
          }
        `}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={selectedOption.color === "blue" ? "text-blue-400" : "text-purple-400"}>
            {selectedOption.icon}
          </span>
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <FaChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden"
          >
            {TASK_TYPES.map((type) => {
              const isSelected = selectedType === type.value;
              const isBlue = type.color === "blue";
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleSelect(type.value)}
                  className={`
                    w-full flex items-start gap-3 px-3 py-3 text-left
                    hover:bg-slate-700 transition-colors duration-150
                    border-b border-slate-600 last:border-b-0
                    ${isSelected ? (isBlue ? "bg-blue-600/30" : "bg-purple-600/30") : ""}
                  `}
                >
                  <span className={`mt-0.5 ${isSelected ? (isBlue ? "text-blue-400" : "text-purple-400") : "text-slate-400"}`}>
                    {type.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isSelected ? (isBlue ? "text-blue-300" : "text-purple-300") : "text-slate-200"}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {type.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskTypeSelector;

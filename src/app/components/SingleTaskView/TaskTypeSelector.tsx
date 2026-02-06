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
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 min-h-[46px]
          bg-slate-700/50 border rounded-lg text-slate-200
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            isOpen
              ? selectedOption.color === "blue"
                ? "border-blue-500/50 ring-2 ring-blue-500/50 bg-slate-700/70"
                : "border-purple-500/50 ring-2 ring-purple-500/50 bg-slate-700/70"
              : "border-slate-600/50 hover:border-slate-500"
          }
        `}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className={`p-1.5 rounded-md ${selectedOption.color === "blue" ? "bg-blue-500/20" : "bg-purple-500/20"}`}>
            <span className={selectedOption.color === "blue" ? "text-blue-400" : "text-purple-400"}>
              {selectedOption.icon}
            </span>
          </div>
          <span className="truncate text-sm font-medium">{selectedOption.label}</span>
        </div>
        <FaChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-slate-800 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
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
                    w-full flex items-center gap-3 px-3 py-3 text-left
                    transition-all duration-150
                    border-b border-slate-700/30 last:border-b-0
                    ${isSelected ? (isBlue ? "bg-blue-500/15" : "bg-purple-500/15") : "hover:bg-slate-700/50"}
                  `}
                >
                  <div className={`p-2 rounded-lg ${isBlue ? "bg-blue-500/20" : "bg-purple-500/20"}`}>
                    <span className={isSelected ? (isBlue ? "text-blue-400" : "text-purple-400") : "text-slate-400"}>
                      {type.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isSelected ? (isBlue ? "text-blue-300" : "text-purple-300") : "text-slate-200"}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
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

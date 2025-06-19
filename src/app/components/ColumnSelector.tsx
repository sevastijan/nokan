// src/app/components/ColumnSelector.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { FaCheck, FaChevronDown, FaColumns } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
// Import the global Column type (adjust path if in Twoim projekcie jest inny)
import type { Column } from "@/app/types/globalTypes";

interface ColumnSelectorProps {
  /**
   * Array of columns to display.
   * Uses the global Column type, which includes at least: id: string, title: string.
   */
  columns: Column[];
  /**
   * Currently selected column ID, or undefined if none selected.
   */
  value?: string;
  /**
   * Callback invoked when user selects a column.
   * Receives the column ID. Should return void.
   */
  onChange: (columnId: string) => void;
  /**
   * Optional label text displayed above the selector.
   * If not provided, defaults to "Move to column:".
   */
  label?: string;
  /**
   * Optional disabled flag: if true, selector is not interactive.
   * If columns array is empty, selector is rendered as non-interactive info.
   */
  disabled?: boolean;
}

/**
 * Animation variants for dropdown list.
 */
const dropdownAnim = {
  initial: { opacity: 0, y: -10, pointerEvents: "none" as any },
  animate: { opacity: 1, y: 0, pointerEvents: "auto" as any },
  exit: { opacity: 0, y: -10, pointerEvents: "none" as any },
  transition: { duration: 0.18 },
};

/**
 * ColumnSelector renders a custom dropdown for choosing a column from a list.
 * - Uses global Column type for items.
 * - If columns array is empty or props.disabled is true, shows a non-interactive placeholder.
 * - value can be undefined or a string matching one of columns[].id.
 */
const ColumnSelector = ({
  columns,
  value,
  onChange,
  label,
  disabled = false,
}: ColumnSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  // If disabled or no columns available: render a non-interactive placeholder
  if (disabled || !Array.isArray(columns) || columns.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-1">
          {label ?? "Move to column:"}
        </label>
        <div className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400">
          {columns.length === 0 ? "No columns available" : "Disabled"}
        </div>
      </div>
    );
  }

  // Determine selected column: match by value, or fallback to first element
  const selected = columns.find((c) => c.id === value) || columns[0];

  return (
    <div ref={ref} className="mb-4 relative w-full max-w-lg">
      <label className="block text-sm text-slate-300 mb-1">
        {label ?? "Move to column:"}
      </label>
      <button
        type="button"
        className={`relative flex items-center justify-between w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
          open
            ? "ring-2 ring-purple-500 border-transparent"
            : "hover:border-slate-500"
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 min-w-0">
          <FaColumns className="text-slate-400" />
          <span className="truncate">{selected.title}</span>
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="ml-2 shrink-0"
        >
          <FaChevronDown className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="absolute left-0 right-0 mt-1 z-20 rounded-xl bg-slate-800/95 backdrop-blur-sm border border-slate-700 shadow-2xl py-1 overflow-auto"
            {...dropdownAnim}
            role="listbox"
            style={{ maxHeight: "15rem" }}
          >
            {columns.map((col) => (
              <li key={col.id}>
                <button
                  type="button"
                  className={`w-full flex items-center px-4 py-2 text-sm text-left gap-3 transition-colors duration-150 ${
                    value === col.id
                      ? "bg-purple-700/30 text-purple-200"
                      : "text-white hover:bg-slate-700 hover:text-purple-300"
                  }`}
                  onClick={() => {
                    // Invoke callback and close dropdown
                    onChange(col.id);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={value === col.id}
                >
                  <FaColumns className="text-slate-400" />
                  <span className="flex-1 truncate">{col.title}</span>
                  {value === col.id && <FaCheck className="text-purple-400" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColumnSelector;

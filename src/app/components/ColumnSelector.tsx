import { useRef, useState, useEffect } from "react";
import { FaCheck, FaChevronDown, FaColumns } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Column {
  id: string;
  title: string;
}
interface ColumnSelectorProps {
  columns: Column[];
  value: string;
  onChange: (columnId: string) => void;
}

const dropdownAnim = {
  initial: { opacity: 0, y: -10, pointerEvents: "none" as any },
  animate: { opacity: 1, y: 0, pointerEvents: "auto" as any },
  exit: { opacity: 0, y: -10, pointerEvents: "none" as any },
  transition: { duration: 0.18 },
};

const ColumnSelector = ({ columns, value, onChange }: ColumnSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or ESC
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const selected = columns.find((c) => c.id === value) || columns[0];

  return (
    <div ref={ref} className="mb-4 relative w-full max-w-lg">
      <label className="block text-sm text-slate-300 mb-1">
        Move to column:
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
          <span className="truncate">{selected?.title}</span>
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
            style={{
              maxHeight: "15rem",
            }}
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

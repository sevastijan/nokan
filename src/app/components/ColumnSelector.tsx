import { useRef, useState, useEffect } from "react";
import { FaCheck, FaChevronDown, FaColumns } from "react-icons/fa";

interface Column {
  id: string;
  title: string;
}
interface ColumnSelectorProps {
  columns: Column[];
  value: string;
  onChange: (columnId: string) => void;
}
const ColumnSelector = ({ columns, value, onChange }: ColumnSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  // Optional: You can use your own useOutsideClick hook here
  // Or this quick one:
  function handleClickOutside(e: MouseEvent) {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }
  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = columns.find((c) => c.id === value) || columns[0];

  return (
    <div ref={ref} className="mb-4 relative w-full max-w-lg">
      <label className="block text-sm text-slate-300 mb-1">
        Move to column:
      </label>
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 relative"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <FaColumns className="text-slate-400" />
          <span>{selected?.title}</span>
        </span>
        <FaChevronDown className="ml-2 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 rounded-lg bg-slate-800 border border-slate-700 shadow-2xl py-1 max-h-64 overflow-y-auto animate-fade-in">
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              className={`w-full flex items-center px-4 py-2 text-sm text-left gap-3
                ${
                  value === col.id
                    ? "bg-purple-700/30 text-purple-200"
                    : "text-white hover:bg-slate-700 hover:text-purple-300"
                }`}
              onClick={() => {
                onChange(col.id);
                setOpen(false);
              }}
            >
              <FaColumns className="text-slate-400" />
              <span className="flex-1">{col.title}</span>
              {value === col.id && <FaCheck className="text-purple-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;

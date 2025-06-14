"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

interface Board {
  id: string;
  title: string;
}

interface BoardSelectProps {
  boards: Board[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

const BoardSelect = ({
  boards,
  value,
  onChange,
  className = "",
}: BoardSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = boards.find((b) => b.id === value);

  return (
    <div ref={ref} className={`relative w-60 ${className}`}>
      <button
        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-xl flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-600"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="truncate">{selected?.title || "Select board..."}</span>
        <FiChevronDown
          className={`ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg max-h-56 overflow-auto">
          {boards.length === 0 && (
            <div className="px-4 py-2 text-slate-400">No boards available</div>
          )}
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setOpen(false);
                onChange(b.id);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-blue-600/30 ${
                value === b.id ? "bg-blue-600/50 text-white" : "text-slate-200"
              }`}
              type="button"
            >
              {b.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardSelect;

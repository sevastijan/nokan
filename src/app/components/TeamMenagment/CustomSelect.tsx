// src/app/components/TeamManagement/CustomSelect.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCheck, FiX } from "react-icons/fi";
import Avatar from "../Avatar/Avatar";
import { CustomSelectProps } from "@/app/types/globalTypes";

const CustomSelect = ({
  options,
  value,
  onChange,
  isMulti = false,
  onDropdownToggle,
}: CustomSelectProps & { onDropdownToggle?: (isOpen: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onDropdownToggle?.(newIsOpen);
  };

  const handleOptionClick = (optionValue: string) => {
    if (isMulti) {
      if (value.includes(optionValue)) {
        onChange(value.filter((v: string) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    } else {
      onChange([optionValue]);
      setIsOpen(false);
      onDropdownToggle?.(false);
    }
  };

  const removeValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v: string) => v !== optionValue));
  };

  useEffect(() => {
    if (!isOpen) {
      onDropdownToggle?.(false);
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onDropdownToggle?.(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        onDropdownToggle?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onDropdownToggle]);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className="relative w-full" ref={selectRef}>
      <button
        type="button"
        className={`relative w-full bg-slate-700/50 border border-slate-600 rounded-xl shadow-sm px-4 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
          isOpen
            ? "ring-2 ring-purple-500 border-transparent"
            : "hover:border-slate-500"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {value.length > 0 ? (
              <div className="flex items-center flex-wrap gap-2">
                {isMulti ? (
                  selectedOptions.map((option) => (
                    <motion.div
                      key={option.value}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg px-2 py-1 text-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {option.image ? (
                        <Avatar
                          src={option.image}
                          alt={option.label}
                          size={20}
                        />
                      ) : null}
                      <span className="text-white font-medium truncate max-w-32">
                        {option.label.split(" (")[0]}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => removeValue(option.value, e)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center gap-3">
                    {selectedOptions[0]?.image ? (
                      <Avatar
                        src={selectedOptions[0].image}
                        alt={selectedOptions[0].label}
                        size={24}
                      />
                    ) : null}
                    <span className="text-white font-medium truncate">
                      {selectedOptions[0]?.label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-400 font-medium">
                {isMulti ? "Select options..." : "Select an option..."}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-2"
          >
            <FiChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute mt-2 w-full rounded-xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="py-2 max-h-64 overflow-y-auto">
              {options.length === 0 ? (
                <li className="px-4 py-3 text-slate-400 text-center">
                  No options available
                </li>
              ) : (
                options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <motion.li
                      key={option.value}
                      className={`mx-2 rounded-lg cursor-pointer select-none transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30"
                          : "hover:bg-slate-700/50"
                      }`}
                      role="option"
                      onClick={() => handleOptionClick(option.value)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: 0.05 }}
                    >
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {option.image ? (
                            <Avatar
                              src={option.image}
                              alt={option.label}
                              size={32}
                            />
                          ) : null}
                          <div className="flex flex-col">
                            <span className="text-white font-medium text-sm">
                              {option.label.split(" (")[0]}
                            </span>
                            {option.label.includes("(") && (
                              <span className="text-slate-400 text-xs">
                                {option.label.split("(")[1]?.replace(")", "")}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                          >
                            <FiCheck className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;

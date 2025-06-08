import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserAvatar } from "../SingleTaskView/utils";
import { CustomSelectProps } from "./types";

const CustomSelect = ({
  options,
  value,
  onChange,
  isMulti = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen((open) => !open);

  const handleOptionClick = (optionValue: string) => {
    if (isMulti) {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    } else {
      onChange([optionValue]);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value[0]);

  return (
    <div className="relative w-full" ref={selectRef}>
      <button
        type="button"
        className="relative w-full bg-[#1E293B] border border-[#475569] rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleOpen}
      >
        <span className="flex items-center space-x-1">
          <AnimatePresence initial={false}>
            {value.length > 0 ? (
              value.map((val) => {
                const option = options.find((o) => o.value === val);
                return (
                  <motion.img
                    key={val}
                    src={
                      option?.image && option.image.length > 0
                        ? option.image
                        : (() => {
                            const avatar = getUserAvatar({
                              id: option?.value || "",
                              name: option?.label || "",
                              email: "",
                            });
                            if (avatar instanceof Promise) {
                              console.error(
                                "getUserAvatar returned a Promise. Ensure it returns a string."
                              );
                              return "";
                            }
                            return avatar;
                          })()
                    }
                    alt="Avatar"
                    className="h-6 w-6 rounded-full"
                    layoutId={val}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                );
              })
            ) : (
              <motion.span
                key="placeholder"
                className="text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Select...
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414l-2.293 2.293a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293l3 3a1 1 0 011.414 1.414l3-3a1 1 0 01-1.414-1.414L10 14.586l-2.293-2.293a1 1 0 01-1.414 1.414l3 3z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute mt-1 w-full rounded-md bg-[#1E293B] shadow-lg z-10 overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <ul ref={listRef} className="py-1 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {options.map((option) => (
                  <motion.li
                    key={option.value}
                    className={`text-white cursor-default select-none relative py-2 pl-3 pr-9 flex items-center ${
                      value.includes(option.value)
                        ? "font-semibold"
                        : "font-normal"
                    }`}
                    role="option"
                    onClick={() => handleOptionClick(option.value)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.1 }}
                  >
                    <img
                      src={
                        option.image && option.image.length > 0
                          ? option.image
                          : (() => {
                              const avatar = getUserAvatar({
                                id: option.value,
                                name: option.label,
                                email: "",
                              });
                              if (avatar instanceof Promise) {
                                console.error(
                                  "getUserAvatar returned a Promise. Ensure it resolves synchronously."
                                );
                                return ""; // Fallback to an empty string
                              }
                              return avatar;
                            })()
                      }
                      alt="Avatar"
                      className="h-6 w-6 rounded-full mr-2"
                    />
                    <span className="block truncate">{option.label}</span>
                    {value.includes(option.value) && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;

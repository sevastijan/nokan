"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiX } from "react-icons/fi";
import Avatar from "../Avatar/Avatar";
import { UserSelectorProps, User } from "@/app/types/globalTypes";

/**
 * UserSelector: Dropdown for selecting a user.
 * - Dark theme, rounded corners.
 * - Shows avatar and name.
 * - Offers "Unassign" if a user is already selected.
 */
const UserSelector = ({
  selectedUser,
  availableUsers,
  onUserSelect,
  label = "Assignee",
}: UserSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown open/close
  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  // Handle selecting a user or unassigning
  const handleOptionClick = useCallback(
    (userId: string | null) => {
      onUserSelect(userId);
      setIsOpen(false);
    },
    [onUserSelect]
  );

  // Render the main button showing the selected user or a placeholder
  return (
    <div className="relative w-full" ref={selectRef}>
      {/* Label */}
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <button
        type="button"
        className={`relative w-full bg-slate-700/50 border border-slate-600 rounded-xl shadow-sm px-4 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
          isOpen
            ? "ring-2 ring-purple-500 border-transparent"
            : "hover:border-slate-500"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleOpen}
      >
        <div className="flex items-center justify-between">
          {/* Selected user or placeholder */}
          <div className="flex items-center gap-3 min-w-0">
            {selectedUser ? (
              <>
                <Avatar
                  src={selectedUser.image || ""}
                  alt={selectedUser.name}
                  size={24}
                />
                <span className="text-white font-medium truncate">
                  {selectedUser.name}
                </span>
              </>
            ) : (
              <span className="text-slate-400 italic truncate">
                Select a user...
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-2 shrink-0"
          >
            <FiChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Dropdown list */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="absolute z-50 mt-1 w-full bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="listbox"
          >
            {/* "Unassign" option if a user is selected */}
            {selectedUser && (
              <li
                className="px-4 py-2 cursor-pointer text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                onClick={() => handleOptionClick(null)}
                role="option"
              >
                <FiX className="w-4 h-4 text-slate-400" />
                <span className="truncate">Unassign</span>
              </li>
            )}
            {/* Separator */}
            {selectedUser && <hr className="border-slate-700 my-1" />}
            {/* User list */}
            {availableUsers.length === 0 ? (
              <li className="px-4 py-2 text-slate-500 text-sm text-center">
                No users
              </li>
            ) : (
              availableUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <li
                    key={user.id}
                    className={`px-4 py-2 cursor-pointer flex items-center gap-3 truncate transition-colors duration-150 ${
                      isSelected
                        ? "bg-purple-600/20 text-white"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                    onClick={() => handleOptionClick(user.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <Avatar src={user.image || ""} alt={user.name} size={20} />
                    <div className="flex flex-col truncate">
                      <span className="truncate">{user.name}</span>
                      {/* Show email in smaller text if you want */}
                      <span className="text-slate-400 text-xs truncate">
                        {user.email}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSelector;

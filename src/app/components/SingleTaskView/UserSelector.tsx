"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { User, UserSelectorProps } from "@/app/types/globalTypes";
import { getAvatarUrl } from "./utils"; // ✅ zamieniony import
import Avatar from "../Avatar/Avatar";
import { useDropdownManager } from "../../hooks/useDropdownManager";

const UserSelector = ({
  selectedUser,
  availableUsers,
  onUserSelect,
  label,
}: UserSelectorProps) => {
  const dropdownId = `user-selector-${Math.random().toString(36).substr(2, 9)}`;
  const { isOpen, toggle, close } = useDropdownManager(dropdownId);

  const selectedAvatar = getAvatarUrl(selectedUser); // ✅ czysta funkcja

  const handleUserSelect = (userId: string | null) => {
    onUserSelect(userId);
    close();
  };

  const handleToggle = () => toggle();

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <motion.button
        whileHover={{ backgroundColor: "#374151" }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedUser ? (
            <>
              <Avatar
                src={selectedAvatar || ""}
                alt={selectedUser.name}
                size={24}
              />
              <span>{selectedUser.name}</span>
            </>
          ) : (
            <>
              <Avatar alt="No User" size={24} />
              <span className="text-gray-400">Select assignee</span>
            </>
          )}
        </div>
        <FaChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <motion.button
              whileHover={{ backgroundColor: "#374151" }}
              onClick={() => handleUserSelect(null)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors border-b border-gray-600"
            >
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-400">✕</span>
              </div>
              <span className="text-gray-400 italic">Unassign</span>
            </motion.button>
            {availableUsers.map((user) => {
              const avatar = getAvatarUrl(user); // ✅ bez hooka
              return (
                <motion.button
                  key={user.id}
                  whileHover={{ backgroundColor: "#374151" }}
                  onClick={() => handleUserSelect(user.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors"
                >
                  <Avatar src={avatar || ""} alt={user.name} size={24} />
                  <span className="text-gray-200">{user.name}</span>
                  {selectedUser?.id === user.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSelector;

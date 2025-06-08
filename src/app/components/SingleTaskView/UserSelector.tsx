"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { User, UserSelectorProps } from "./types";
import { getUserAvatar } from "./utils";
import Avatar from "../Avatar/Avatar";

/**
 * UserSelector component shows a dropdown to select a user.
 * Displays selected user avatar and name or a placeholder if none selected.
 * Supports unassigning user and animates open/close with framer-motion.
 */
const UserSelector = ({
  selectedUser,
  availableUsers,
  onUserSelect,
  label,
}: UserSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (selectedUser) {
        const url = await getUserAvatar(selectedUser);
        setAvatarUrl(url);
      } else {
        setAvatarUrl(null);
      }
    };

    loadAvatar();
  }, [selectedUser]);

  /**
   * Handle user selection and close dropdown
   * @param userId selected user ID or null to unassign
   */
  const handleUserSelect = async (userId: string | null) => {
    await onUserSelect(userId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <motion.button
        whileHover={{ backgroundColor: "#374151" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedUser ? (
            <>
              <Avatar src={avatarUrl || ""} alt={selectedUser.name} size={24} />
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
            <div className="max-h-48 overflow-y-auto">
              {/* Option to unassign */}
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
              {/* Use a regular for loop to await inside */}
              {availableUsers.map((user) => (
                <motion.button
                  key={user.id}
                  whileHover={{ backgroundColor: "#374151" }}
                  onClick={() => handleUserSelect(user.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors"
                >
                  <Avatar src={user.image || ""} alt={user.name} size={24} />
                  <span className="text-gray-200">{user.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSelector;

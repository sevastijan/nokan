"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaUser } from "react-icons/fa";
import { User } from "./types";
import { getUserAvatar } from "./utils";

interface UserSelectorProps {
  selectedUser: User | null;
  availableUsers: User[];
  onUserSelect: (userId: string) => Promise<void>;
  label: string;
}

const UserSelector = ({
  selectedUser,
  availableUsers,
  onUserSelect,
  label,
}: UserSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleUserSelect = async (userId: string) => {
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
              <img
                src={getUserAvatar(selectedUser)}
                alt={selectedUser.name}
                className="w-6 h-6 rounded-full"
              />
              <span>{selectedUser.name}</span>
            </>
          ) : (
            <>
              <FaUser className="w-6 h-6 text-gray-400" />
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
            {availableUsers.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ backgroundColor: "#4B5563" }}
                onClick={() => handleUserSelect(user.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors"
              >
                <img
                  src={getUserAvatar(user)}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <div className="text-gray-200">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
                {selectedUser?.id === user.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSelector;

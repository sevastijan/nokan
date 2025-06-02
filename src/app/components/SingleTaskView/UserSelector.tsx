"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaCheck, FaChevronDown } from "react-icons/fa";
import { User } from "./types";

interface UserSelectorProps {
  selectedUser?: User;
  availableUsers: User[];
  onUserSelect: (userId: string) => void;
  label: string;
}

/**
 * User selector component with avatar and dropdown
 */
const UserSelector = ({
  selectedUser,
  availableUsers,
  onUserSelect,
  label,
}: UserSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getUserAvatar = (user: User) => {
    return (
      user.image ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name
      )}&background=3b82f6&color=fff`
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <label className="w-32 text-sm font-medium text-gray-300 flex-shrink-0">
          {label}
        </label>

        {selectedUser ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors min-w-[200px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <img
              src={getUserAvatar(selectedUser)}
              alt={selectedUser.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-200 flex-1">
              {selectedUser.name}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="text-gray-400"
            >
              <FaChevronDown className="w-3 h-3" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-500 min-w-[200px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <FaPlus className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-sm text-gray-400 flex-1">Unassigned</span>
            <FaChevronDown className="w-3 h-3 text-gray-400" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-32 mt-2 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-50 min-w-[250px]"
            >
              <div className="p-2">
                <motion.div
                  whileHover={{ backgroundColor: "#4b5563" }}
                  className="flex items-center gap-3 p-3 rounded cursor-pointer"
                  onClick={() => {
                    onUserSelect("");
                    setIsOpen(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <FaPlus className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-300 flex-1">
                    Unassigned
                  </span>
                  {!selectedUser && (
                    <FaCheck className="w-4 h-4 text-green-500" />
                  )}
                </motion.div>

                {availableUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ backgroundColor: "#4b5563" }}
                    className="flex items-center gap-3 p-3 rounded cursor-pointer"
                    onClick={() => {
                      onUserSelect(user.id);
                      setIsOpen(false);
                    }}
                  >
                    <img
                      src={getUserAvatar(user)}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-200">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <FaCheck className="w-4 h-4 text-green-500" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSelector;

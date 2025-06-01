"use client";

import { useState, useEffect } from "react";
import AddPriorityModal from "./AddPriorityModal";
import { motion, AnimatePresence } from "framer-motion";
import { getPriorities } from "../lib/api";
import { FaChevronDown } from "react-icons/fa"; // Import ikony

interface Priority {
  id: string;
  label: string;
  color: string;
}

interface PrioritySelectorProps {
  selectedPriority: string;
  onChange: (priority: string) => void;
}

const PrioritySelector = ({
  selectedPriority,
  onChange,
}: PrioritySelectorProps) => {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const data = await getPriorities();
        setPriorities(data);
      } catch (error) {
        console.error("Error fetching priorities:", error);
      }
    };
    fetchPriorities();
  }, []);

  const handleAddPriority = (newPriority: Priority) => {
    setPriorities([...priorities, newPriority]);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsDropdownOpen(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-lg font-medium mb-2">Priority:</label>
      <div
        className="bg-gray-800 text-white border border-gray-600 rounded-lg p-3 cursor-pointer flex justify-between items-center"
        onClick={toggleDropdown}
      >
        <span>{selectedPriority || "Select Priority"}</span>
        <motion.div
          animate={{ rotate: isDropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown size={16} />
        </motion.div>
      </div>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.ul
            className="absolute bg-gray-900 text-white border border-gray-600 rounded-lg mt-2 w-full z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                onChange("Low");
                setIsDropdownOpen(false);
              }}
            >
              Low
            </li>
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                onChange("Medium");
                setIsDropdownOpen(false);
              }}
            >
              Medium
            </li>
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                onChange("High");
                setIsDropdownOpen(false);
              }}
            >
              High
            </li>
            {priorities.map((priority) => (
              <li
                key={priority.id}
                className="p-3 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  onChange(priority.label);
                  setIsDropdownOpen(false);
                }}
              >
                {priority.label}
              </li>
            ))}
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer text-blue-400"
              onClick={() => {
                setIsModalOpen(true);
                setIsDropdownOpen(false);
              }}
            >
              + Add Priority
            </li>
          </motion.ul>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50"
            onClick={handleOutsideClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-900 text-white rounded-lg p-6 w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AddPriorityModal
                onClose={() => setIsModalOpen(false)}
                onAddPriority={handleAddPriority}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrioritySelector;

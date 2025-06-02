"use client";

import { useState, useEffect } from "react";
import AddPriorityModal from "./AddPriorityModal";
import { motion, AnimatePresence } from "framer-motion";
import { getPriorities } from "../../lib/api";
import { FaChevronDown } from "react-icons/fa";

interface Priority {
  id: string;
  label: string;
  color: string;
}

interface PrioritySelectorProps {
  selectedPriority: string;
  onChange: (priority: string) => void;
}

/**
 * Priority selector component with dropdown and add priority functionality
 * @param selectedPriority - Currently selected priority value
 * @param onChange - Function to handle priority selection changes
 * @returns JSX element containing the priority selector interface
 */
const PrioritySelector = ({
  selectedPriority,
  onChange,
}: PrioritySelectorProps) => {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /**
   * Fetch priorities from API on component mount
   */
  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const data = await getPriorities();
        setPriorities(data);
      } catch (error) {
        // Error handling without console.log - could be replaced with toast notification
      }
    };
    fetchPriorities();
  }, []);

  /**
   * Handle adding a new priority to the list
   * @param newPriority - Priority object to add to the list
   */
  const handleAddPriority = (newPriority: Priority) => {
    setPriorities([...priorities, newPriority]);
  };

  /**
   * Toggle dropdown visibility
   */
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  /**
   * Handle clicks outside modal to close it
   * @param e - Mouse event from the backdrop
   */
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsDropdownOpen(false);
      setIsModalOpen(false);
    }
  };

  /**
   * Handle priority selection and close dropdown
   * @param priority - Selected priority value
   */
  const handlePrioritySelect = (priority: string) => {
    onChange(priority);
    setIsDropdownOpen(false);
  };

  /**
   * Open add priority modal and close dropdown
   */
  const openAddPriorityModal = () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false);
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
              onClick={() => handlePrioritySelect("Low")}
            >
              Low
            </li>
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => handlePrioritySelect("Medium")}
            >
              Medium
            </li>
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer"
              onClick={() => handlePrioritySelect("High")}
            >
              High
            </li>
            {priorities.map((priority) => (
              <li
                key={priority.id}
                className="p-3 hover:bg-gray-700 cursor-pointer"
                onClick={() => handlePrioritySelect(priority.label)}
              >
                {priority.label}
              </li>
            ))}
            <li
              className="p-3 hover:bg-gray-700 cursor-pointer text-blue-400"
              onClick={openAddPriorityModal}
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

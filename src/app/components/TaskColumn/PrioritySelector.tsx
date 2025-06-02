"use client";

import { useState, useEffect } from "react";
import AddPriorityModal from "./AddPriorityModal";
import { motion, AnimatePresence } from "framer-motion";
import { getPriorities } from "../../lib/api";
import { FaChevronDown, FaTrash } from "react-icons/fa";

interface Priority {
  id: string;
  label: string;
  color: string;
}

interface PrioritySelectorProps {
  selectedPriority: string;
  onChange: (priority: string) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
}

/**
 * Priority selector component with dropdown and add priority functionality
 * @param selectedPriority - Currently selected priority value
 * @param onChange - Function to handle priority selection changes
 * @param onDropdownToggle - Optional function to handle dropdown toggle state changes
 * @returns JSX element containing the priority selector interface
 */
const PrioritySelector = ({
  selectedPriority,
  onChange,
  onDropdownToggle,
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
   * Handle deleting a priority
   * @param priorityId - ID of the priority to delete
   * @param e - Mouse event to prevent propagation
   */
  const handleDeletePriority = async (
    priorityId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      // TODO: Call API to delete priority
      // await deletePriority(priorityId);
      setPriorities(priorities.filter((p) => p.id !== priorityId));
    } catch (error) {
      // TODO :Error handling
    }
  };

  /**
   * Toggle dropdown visibility
   */
  const toggleDropdown = () => {
    const newState = !isDropdownOpen;
    setIsDropdownOpen(newState);
    onDropdownToggle?.(newState);
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
    onDropdownToggle?.(false);
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
      <label className="block text-xs font-medium mb-1.5">Priority:</label>
      <div
        className="bg-gray-800 text-white border border-gray-600 rounded-lg p-2.5 cursor-pointer flex justify-between items-center text-sm"
        onClick={toggleDropdown}
      >
        <span>{selectedPriority || "Select Priority"}</span>
        <motion.div
          animate={{ rotate: isDropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown size={12} />
        </motion.div>
      </div>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.ul
            className="absolute bg-gray-900 text-white border border-gray-600 rounded-lg mt-1 w-full z-10 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <li
              className="p-2.5 hover:bg-gray-700 cursor-pointer"
              onClick={() => handlePrioritySelect("Low")}
            >
              Low
            </li>
            <li
              className="p-2.5 hover:bg-gray-700 cursor-pointer"
              onClick={() => handlePrioritySelect("Medium")}
            >
              Medium
            </li>
            <li
              className="p-2.5 hover:bg-gray-700 cursor-pointer"
              onClick={() => handlePrioritySelect("High")}
            >
              High
            </li>
            {priorities.map((priority) => (
              <li
                key={priority.id}
                className="p-2.5 hover:bg-gray-700 cursor-pointer flex justify-between items-center group"
                onClick={() => handlePrioritySelect(priority.label)}
              >
                <span>{priority.label}</span>
                <button
                  onClick={(e) => handleDeletePriority(priority.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-all duration-200"
                  title="Delete priority"
                >
                  <FaTrash size={10} />
                </button>
              </li>
            ))}
            <li
              className="p-2.5 hover:bg-gray-700 cursor-pointer text-blue-400 border-t border-gray-600"
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
              className="bg-gray-900 text-white rounded-lg p-4 w-full max-w-xs"
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

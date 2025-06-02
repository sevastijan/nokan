"use client";

import { useState, useEffect } from "react";
import AddPriorityModal from "./AddPriorityModal";
import { motion, AnimatePresence } from "framer-motion";
import { getPriorities, addPriority, deletePriority } from "../../lib/api";
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
        //TODO: Error handling without console.log - could be replaced with toast notification
      }
    };
    fetchPriorities();
  }, []);

  /**
   * Handle adding a new priority to the list
   * @param newPriority - Priority object to add to the list
   */
  const handleAddPriority = async (newPriority: Priority) => {
    try {
      const createdPriority = await addPriority(
        newPriority.label,
        newPriority.color
      );
      setPriorities([...priorities, createdPriority]);
    } catch (error) {
      console.error("Error adding priority:", error);
      // TODO: Show error toast notification
    }
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
      await deletePriority(priorityId);
      setPriorities(priorities.filter((p) => p.id !== priorityId));
    } catch (error) {
      console.error("Error deleting priority:", error);
      // TODO: Show error toast notification
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
          <>
            {/* Overlay to close dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsDropdownOpen(false);
                onDropdownToggle?.(false);
              }}
            />
            <motion.ul
              className="absolute bg-gray-900 text-white border border-gray-600 rounded-lg mt-1 w-full text-sm shadow-lg"
              style={{ zIndex: 9999 }}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <li
                className="p-2.5 hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                onClick={() => handlePrioritySelect("Low")}
              >
                Low
              </li>
              <li
                className="p-2.5 hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                onClick={() => handlePrioritySelect("Medium")}
              >
                Medium
              </li>
              <li
                className="p-2.5 hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                onClick={() => handlePrioritySelect("High")}
              >
                High
              </li>
              {priorities.map((priority) => (
                <li
                  key={priority.id}
                  className="p-2.5 hover:bg-gray-700 cursor-pointer flex justify-between items-center group transition-colors duration-150"
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
                className="p-2.5 hover:bg-gray-700 cursor-pointer text-blue-400 border-t border-gray-600 transition-colors duration-150"
                onClick={openAddPriorityModal}
              >
                + Add Priority
              </li>
            </motion.ul>
          </>
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

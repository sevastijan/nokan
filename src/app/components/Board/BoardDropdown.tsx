import { motion, AnimatePresence } from "framer-motion";
import { FiMoreHorizontal, FiEdit, FiTrash2 } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface BoardDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Dropdown menu component for board actions (edit/delete)
 * @param onEdit - Function to handle edit action
 * @param onDelete - Function to handle delete action
 * @returns JSX element containing the dropdown menu interface
 */
const BoardDropdown = ({ onEdit, onDelete }: BoardDropdownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Handle clicks outside the dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-gray-400 hover:text-white rounded cursor-pointer"
      >
        <FiMoreHorizontal size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px]"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
            >
              <FiEdit size={14} />
              {t('common.edit')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
            >
              <FiTrash2 size={14} />
              {t('common.delete')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BoardDropdown;

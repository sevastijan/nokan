import { useState, useEffect, useCallback } from 'react';

let globalActiveDropdown: string | null = null;
const dropdownListeners = new Set<(activeId: string | null) => void>();

export const useDropdownManager = (dropdownId: string) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateListener = useCallback((activeId: string | null) => {
    setIsOpen(activeId === dropdownId);
  }, [dropdownId]);

  useEffect(() => {
    dropdownListeners.add(updateListener);
    return () => {
      dropdownListeners.delete(updateListener);
    };
  }, [updateListener]);

  const toggle = useCallback(() => {
    const newState = globalActiveDropdown !== dropdownId;
    globalActiveDropdown = newState ? dropdownId : null;
    
    // Notify all listeners
    dropdownListeners.forEach(listener => {
      listener(globalActiveDropdown);
    });
  }, [dropdownId]);

  const close = useCallback(() => {
    if (globalActiveDropdown === dropdownId) {
      globalActiveDropdown = null;
      dropdownListeners.forEach(listener => {
        listener(null);
      });
    }
  }, [dropdownId]);

  return { isOpen, toggle, close };
};
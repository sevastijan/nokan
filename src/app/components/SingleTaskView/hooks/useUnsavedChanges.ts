import { useState, useEffect } from 'react';

export const useUnsavedChanges = (isNewTask: boolean) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (hasUnsavedChanges) {
          setShowUnsavedAlert(true);
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [hasUnsavedChanges]);

  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const markAsSaved = () => {
    setHasUnsavedChanges(false);
  };

  const showUnsavedChangesAlert = () => {
    setShowUnsavedAlert(true);
  };

  const hideUnsavedChangesAlert = () => {
    setShowUnsavedAlert(false);
  };

  return {
    hasUnsavedChanges,
    showUnsavedAlert,
    markAsChanged,
    markAsSaved,
    showUnsavedChangesAlert,
    hideUnsavedChangesAlert,
  };
};
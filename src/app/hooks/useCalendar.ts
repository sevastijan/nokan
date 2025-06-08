import { useState, useCallback } from 'react';

export const useCalendar = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshCalendar = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    refreshKey,
    refreshCalendar
  };
};
import { useState, useEffect } from 'react';

export const useTaskDates = (initialStartDate = '', initialEndDate = '') => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Update dates when initial values change
  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const handleDateChange = (dateType: "start" | "end", value: string, onChanged?: () => void) => {
    if (dateType === "start") {
      setStartDate(value);
      // Clear end date if it's before start date
      if (endDate && value && new Date(value) > new Date(endDate)) {
        setEndDate("");
      }
    } else {
      setEndDate(value);
    }

    onChanged?.();
  };

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    handleDateChange,
  };
};
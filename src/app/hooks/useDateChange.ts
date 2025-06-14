// src/app/components/SingleTaskView/hooks/useDateChange.ts
import { useState, useEffect } from "react";
import { TaskDetail } from "@/app/types/globalTypes";

export function useDateChange(
  task: TaskDetail | null,
  updateTask: (updates: Partial<TaskDetail>) => void
) {
  const [startDate, setStartDate] = useState<string>(task?.start_date || "");
  const [endDate, setEndDate] = useState<string>(task?.end_date || "");

  // Sync when task changes
  useEffect(() => {
    if ((task?.start_date || "") !== startDate) {
      setStartDate(task?.start_date || "");
    }
    if ((task?.end_date || "") !== endDate) {
      setEndDate(task?.end_date || "");
    }
    // Note: not including startDate/endDate in deps to avoid loops; effect only triggers on `task`
  }, [task]);

  const handleStartChange = (value: string) => {
    setStartDate(value);
    updateTask({ start_date: value });
  };

  const handleEndChange = (value: string) => {
    setEndDate(value);
    updateTask({ end_date: value });
  };

  return { startDate, endDate, handleStartChange, handleEndChange };
}

import { useState, useEffect } from "react";
import { TaskDetail } from "@/app/types/globalTypes";

export function useDescriptionChange(
  task: TaskDetail | null,
  updateTask: (updates: Partial<TaskDetail>) => void
) {
  const [description, setDescription] = useState<string>(
    task?.description || ""
  );

  // Sync when task.description changes
  useEffect(() => {
    if ((task?.description || "") !== description) {
      setDescription(task?.description || "");
    }
  }, [task]);

  const handleChange = (newDesc: string) => {
    setDescription(newDesc);
    updateTask({ description: newDesc });
  };

  return { description, handleChange };
}

import { useState, useEffect, useCallback } from "react";
import { TaskDetail } from "@/app/types/globalTypes";

export function useTitleChange(
  task: TaskDetail | null,
  onUpdate: (updates: Partial<TaskDetail>) => void
) {
  // 1) local state for the input
  const [title, setTitle] = useState("");

  // 2) sync from `task` always at the same position
  useEffect(() => {
    setTitle(task?.title ?? "");
  }, [task]);

  // 3) change handler
  const handleChange = useCallback(
    (newValue: string) => {
      setTitle(newValue);
      onUpdate({ title: newValue });
    },
    [onUpdate]
  );

  return { title, handleChange };
}

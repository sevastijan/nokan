// src/app/components/SingleTaskView/hooks/useAssigneeChange.ts
import { useState, useEffect } from "react";
import { TaskDetail, User } from "@/app/types/globalTypes";

export function useAssigneeChange(
  task: TaskDetail | null,
  teamMembers: User[],
  updateTask: (updates: Partial<TaskDetail>) => void
) {
  // Initialize from task.assignee.id or task.user_id
  const initialId = task?.assignee?.id || task?.user_id || null;
  const [assigneeId, setAssigneeId] = useState<string | null>(initialId);

  // Sync when task changes
  useEffect(() => {
    const newId = task?.assignee?.id || task?.user_id || null;
    if (newId !== assigneeId) {
      setAssigneeId(newId);
    }
  }, [task]);

  const handleChange = async (newId: string | null) => {
    setAssigneeId(newId);
    if (!newId) {
      // Clear assignee
      await updateTask({ user_id: null, assignee: null });
    } else {
      // Find full user object among teamMembers
      const userObj = teamMembers.find((u) => u.id === newId) || null;
      if (userObj) {
        await updateTask({ user_id: newId, assignee: userObj });
      } else {
        // If not found, still clear
        await updateTask({ user_id: null, assignee: null });
      }
    }
  };

  return { assigneeId, handleChange };
}

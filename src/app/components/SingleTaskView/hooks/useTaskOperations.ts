import { useState } from 'react';
import { toast } from 'react-toastify';
import { deleteTask, updateTaskDetails, updateTaskDates } from '../../../lib/api';
import { TaskDetail } from '../types';

interface UseTaskOperationsProps {
  task: TaskDetail | null;
  taskId?: string;
  columnId?: string;
  isNewTask: boolean;
  startDate: string;
  endDate: string;
  onTaskUpdate?: () => void;
  onTaskAdded?: (columnId: string, title: string, priority?: number, userId?: number) => Promise<any>;
  onClose: () => void;
  markAsSaved: () => void;
}

export const useTaskOperations = ({
  task,
  taskId,
  columnId,
  isNewTask,
  startDate,
  endDate,
  onTaskUpdate,
  onTaskAdded,
  onClose,
  markAsSaved,
}: UseTaskOperationsProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveExistingTask = async () => {
    if (!task || !task.id) return;

    setIsSaving(true);
    try {
      const updates = {
        title: task.title.trim(),
        description: task.description?.trim() || "",
        priority: task.priority || null,
        user_id: task.user_id || null,
      };

      await updateTaskDetails(task.id, updates);

      // Update dates if they changed
      const currentStartDate = (task as any).start_date;
      const currentEndDate = (task as any).end_date;

      if (startDate !== currentStartDate || endDate !== currentEndDate) {
        await updateTaskDates(task.id, startDate || null, endDate || null);
      }

      onTaskUpdate?.();
      markAsSaved();
      toast.success("Task saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewTask = async () => {
    if (!task || !task.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!columnId) {
      toast.error("Cannot create task - missing column ID");
      return;
    }

    setIsSaving(true);
    try {
      let newTask;
      if (onTaskAdded) {
        // Convert string values to numbers
        const priority = task.priority ? Number(task.priority) : undefined;
        const userId = task.user_id ? Number(task.user_id) : undefined;
        
        newTask = await onTaskAdded(
          columnId,
          task.title.trim(),
          priority,
          userId
        );
      } else {
        toast.error("Cannot create task - no callback provided");
        return;
      }

      // Add dates to newly created task if provided
      if ((startDate || endDate) && newTask?.id) {
        await updateTaskDates(newTask.id, startDate || null, endDate || null);
      }

      onClose();
      markAsSaved();
      toast.success("Task created successfully!");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;

    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setIsSaving(true);
    try {
      await deleteTask(taskId);
      onTaskUpdate?.();
      onClose();
      toast.success("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleSaveExistingTask,
    handleSaveNewTask,
    handleDeleteTask,
  };
};
"use client";

import { JSX, useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import { addTask as addTaskToRedux } from "../../store/slices/boardSlice";
import { addTask as addTaskToDB } from "../../lib/api";
import TaskModal from "../TaskModal";

interface AddTaskFormProps {
  boardId: string;
  columnId: string;
  onTaskAdded?: (newTask: { id: string; title: string }) => void;
}

/**
 * Add task form component that handles adding new tasks to columns
 * @param boardId - The ID of the board containing the column
 * @param columnId - The ID of the column to add the task to
 * @param onTaskAdded - Optional callback function called when a task is successfully added
 * @returns JSX element containing the add task form interface
 */
const AddTaskForm = ({
  boardId,
  columnId,
  onTaskAdded,
}: AddTaskFormProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle adding a new task
   * @param taskData - The task data including title, description, and priority
   */
  const handleAdd = async (taskData: {
    title: string;
    description?: string;
    priority?: string;
  }) => {
    if (!taskData.title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newTask = await addTaskToDB(columnId, taskData.title.trim(), 0);

      if (!newTask || !newTask.id || !newTask.title) {
        throw new Error("Invalid task data returned from the database");
      }

      dispatch(addTaskToRedux({ boardId, columnId, taskTitle: newTask.title }));

      if (onTaskAdded) {
        onTaskAdded(newTask);
      }

      setIsModalOpen(false);
    } catch (err) {
      setError("Failed to add task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className={`w-full py-1 rounded ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white"
        }`}
        disabled={loading}
      >
        {loading ? "Adding..." : "Add Task"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode="add"
          onAddTask={handleAdd}
        />
      )}
    </div>
  );
};

export default AddTaskForm;

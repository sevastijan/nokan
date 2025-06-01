"use client";

import { JSX, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/index";
import { addTask as addTaskToRedux } from "../store/slices/boardSlice";
import { addTask as addTaskToDB } from "../lib/api";
import TaskModal from "./TaskModal";

const AddTaskForm = ({
  boardId,
  columnId,
  onTaskAdded,
}: {
  boardId: string;
  columnId: string;
  onTaskAdded?: (newTask: { id: string; title: string }) => void;
}): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the addition of a new task.
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

      if (
        !newTask ||
        typeof newTask.id !== "string" ||
        typeof newTask.title !== "string"
      ) {
        throw new Error("Invalid task data returned from the database");
      }

      dispatch(addTaskToRedux({ boardId, columnId, taskTitle: newTask.title }));

      if (onTaskAdded) {
        onTaskAdded(newTask);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-green-600 text-white py-1 rounded"
      >
        Add Task
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

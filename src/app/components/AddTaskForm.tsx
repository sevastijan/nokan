"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/index";
import { addTask as addTaskToRedux } from "../store/slices/boardSlice";
import { addTask as addTaskToDB } from "../lib/api";

/**
 * Component for adding a new task to a specific column in a board.
 *
 * @param {Object} props - The component props.
 * @param {string} props.boardId - The ID of the board where the task will be added.
 * @param {string} props.columnId - The ID of the column where the task will be added.
 * @param {Function} [props.onTaskAdded] - Optional callback function triggered after a task is successfully added.
 * @returns {JSX.Element} The rendered AddTaskForm component.
 */
const AddTaskForm = ({
  boardId,
  columnId,
  onTaskAdded,
}: {
  boardId: string;
  columnId: string;
  onTaskAdded?: (newTask: { id: string; title: string }) => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the addition of a new task.
   * Validates the input, updates the database, Redux store, and resets the form.
   */
  const handleAdd = async () => {
    if (!title.trim()) return; // Prevent adding empty tasks

    setLoading(true);
    setError(null);

    try {
      // Save the task to the database
      const newTask = await addTaskToDB(columnId, title.trim(), 0);

      dispatch(addTaskToRedux({ boardId, columnId, taskTitle: newTask.title }));

      if (onTaskAdded) {
        onTaskAdded(newTask);
      }

      setTitle("");
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task"
        className="w-full border px-2 py-1 rounded mb-1"
        disabled={loading}
      />
      <button
        onClick={handleAdd}
        className="w-full bg-green-600 text-white py-1 rounded"
        disabled={loading}
      >
        {loading ? "Adding..." : "Add Task"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default AddTaskForm;

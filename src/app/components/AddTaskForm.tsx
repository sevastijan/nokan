"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/index";
import { addTask as addTaskToRedux } from "../store/slices/boardSlice";
import { addTask as addTaskToDB } from "../lib/api";

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

  const handleAdd = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Zapisz zadanie w bazie danych
      const newTask = await addTaskToDB(columnId, title.trim(), 0); // 0 jako przykładowy order

      // Zaktualizuj stan Redux
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

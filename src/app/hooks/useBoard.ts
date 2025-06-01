import { useState, useEffect } from "react";
import {
  getBoardById,
  addColumn,
  deleteColumn,
  deleteTask,
  updateBoardTitle,
  updateTaskTitle,
  updateColumnTitle,
} from "../lib/api";

export const useBoard = (boardId: string) => {
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    getBoardById(boardId)
      .then((data) => setBoard(data))
      .catch((err) => console.error("Error loading board:", err));
  }, [boardId]);

  const updateBoard = (updatedBoard: any) => {
    setBoard(updatedBoard);
  };

  const handleUpdateBoardTitle = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === board.title) return;

    setLoading(true);
    setError(null);

    try {
      await updateBoardTitle(board.id, newTitle.trim());
      setBoard((prev: any) => ({ ...prev, title: newTitle.trim() }));
    } catch (err) {
      console.error("Error updating board title:", err);
      setError("Failed to update board title. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async (title: string) => {
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newColumn = await addColumn(board.id, title.trim(), board.columns.length);
      setBoard((prev: any) => ({
        ...prev,
        columns: [...prev.columns, { ...newColumn, tasks: [] }],
      }));
    } catch (err) {
      console.error("Error adding column:", err);
      setError("Failed to add column. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveColumn = async (columnId: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteColumn(columnId);
      setBoard((prev: any) => ({
        ...prev,
        columns: prev.columns.filter((col: any) => col.id !== columnId),
      }));
    } catch (err) {
      console.error("Error removing column:", err);
      setError("Failed to remove column. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await updateColumnTitle(columnId, newTitle.trim());
      setBoard((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) =>
          col.id === columnId ? { ...col, title: newTitle.trim() } : col
        ),
      }));
    } catch (err) {
      console.error("Error updating column title:", err);
      setError("Failed to update column title. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskTitle = async (columnId: string, taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await updateTaskTitle(taskId, newTitle.trim());
      setBoard((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.map((task: any) =>
                  task.id === taskId ? { ...task, title: newTitle.trim() } : task
                ),
              }
            : col
        ),
      }));
    } catch (err) {
      console.error("Error updating task title:", err);
      setError("Failed to update task title. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (columnId: string, updatedTask: any) => {
    setLoading(true);
    setError(null);

    try {
      setBoard((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.map((task: any) =>
                  task.id === updatedTask.id ? { ...task, ...updatedTask } : task
                ),
              }
            : col
        ),
      }));
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTask = async (columnId: string, taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteTask(taskId);
      setBoard((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.filter((task: any) => task.id !== taskId),
              }
            : col
        ),
      }));
    } catch (err) {
      console.error("Error removing task:", err);
      setError("Failed to remove task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    board,
    loading,
    error,
    updateBoard,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleUpdateTaskTitle,
    handleUpdateTask,
    handleRemoveTask,
  };
};
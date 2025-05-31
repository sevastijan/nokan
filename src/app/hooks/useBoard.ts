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

/**
 * Custom hook for managing board data and operations.
 *
 * @param {string} boardId - The ID of the board to manage.
 * @returns {Object} The board data and related handlers.
 */
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

  /**
   * Updates the board title.
   */
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

  /**
   * Adds a new column to the board.
   */
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

  /**
   * Removes a column from the board.
   */
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

  /**
   * Updates the title of a column.
   */
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

  /**
   * Updates the title of a task.
   */
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

  /**
   * Removes a task from a column.
   */
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
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleUpdateTaskTitle,
    handleRemoveTask,
  };
};
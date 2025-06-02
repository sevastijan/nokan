import { useState, useEffect } from "react";
import {
  getBoardById,
  addColumn,
  deleteColumn,
  deleteTask,
  updateBoardTitle,
  updateTaskTitle,
  updateColumnTitle,
  updateTask,
} from "../lib/api";
import { Task, Column, Board } from "../types/useBoardTypes";

/**
 * Custom hook for managing board state and operations
 * @param {string} boardId - The ID of the board to manage
 * @returns {object} Object containing board state and handler functions
 */
export const useBoard = (boardId: string) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch board data
   */
  const fetchBoardData = async () => {
    if (!boardId) return;

    try {
      setLoading(true);
      const data = await getBoardById(boardId);
      const updatedData: Board = {
        ...data,
        columns: data.columns.map((col) => ({
          id: col.id,
          title: col.title,
          order: col.order,
          boardId: data.id,
          tasks: (col.tasks || []).map((task) => ({
            id: task.id,
            title: task.title,
            order: task.order || 0,
            description: task.description,
            priority: task.priority,
            images: task.images,
            user_id: task.user_id,
            assignee: Array.isArray(task.assignee) 
              ? task.assignee[0] 
              : task.assignee, 
            created_at: task.created_at,
            updated_at: task.updated_at,
          })),
        })),
      };
      setBoard(updatedData);
      setError(null);
    } catch (err) {
      setError("Failed to load board. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch board data when boardId changes
   */
  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  /**
   * Update the entire board state
   * @param {Board} updatedBoard - New board data to set
   */
  const updateBoard = (updatedBoard: Board) => {
    setBoard(updatedBoard);
  };

  /**
   * Get a column by its ID
   * @param {string} columnId - ID of the column to find
   * @returns {Column | undefined} Column object or undefined if not found
   */
  const getColumnById = (columnId: string): Column | undefined => {
    return board?.columns.find((col) => col.id === columnId);
  };

  /**
   * Update board title
   * @param {string} newTitle - New title for the board
   */
  const handleUpdateBoardTitle = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === board?.title) return;

    setLoading(true);
    setError(null);

    try {
      await updateBoardTitle(board!.id, newTitle.trim());
      setBoard((prev) => (prev ? { ...prev, title: newTitle.trim() } : prev));
    } catch (err) {
      setError("Failed to update board title. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new column to the board
   * @param {string} title - Title for the new column
   */
  const handleAddColumn = async (title: string) => {
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newColumn = await addColumn(board!.id, title.trim(), board!.columns.length);
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: [...prev.columns, { ...newColumn, tasks: [], boardId: prev.id }],
            }
          : prev
      );
    } catch (err) {
      setError("Failed to add column. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a column from the board
   * @param {string} columnId - ID of the column to remove
   */
  const handleRemoveColumn = async (columnId: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteColumn(columnId);
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.filter((col) => col.id !== columnId),
            }
          : prev
      );
    } catch (err) {
      setError("Failed to remove column. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update column title
   * @param {string} columnId - ID of the column to update
   * @param {string} newTitle - New title for the column
   */
  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await updateColumnTitle(columnId, newTitle.trim());
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((col) =>
                col.id === columnId ? { ...col, title: newTitle.trim() } : col
              ),
            }
          : prev
      );
    } catch (err) {
      setError("Failed to update column title. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update task title
   * @param {string} columnId - ID of the column containing the task
   * @param {string} taskId - ID of the task to update
   * @param {string} newTitle - New title for the task
   */
  const handleUpdateTaskTitle = async (columnId: string, taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await updateTaskTitle(taskId, newTitle.trim());
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((col) =>
                col.id === columnId
                  ? {
                      ...col,
                      tasks: col.tasks.map((task) =>
                        task.id === taskId ? { ...task, title: newTitle.trim() } : task
                      ),
                    }
                  : col
              ),
            }
          : prev
      );
    } catch (err) {
      setError("Failed to update task title. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an entire task object
   * @param {string} columnId - ID of the column containing the task
   * @param {Task} updatedTask - Updated task object
   */
  const handleUpdateTask = async (columnId: string, updatedTask: Task) => {
    setLoading(true);
    setError(null);

    try {
      await updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
      });

      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((col) =>
                col.id === columnId
                  ? {
                      ...col,
                      tasks: col.tasks.map((task) =>
                        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
                      ),
                    }
                  : col
              ),
            }
          : prev
      );
    } catch (err) {
      setError("Failed to update task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a task from a column
   * @param {string} columnId - ID of the column containing the task
   * @param {string} taskId - ID of the task to remove
   */
  const handleRemoveTask = async (columnId: string, taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      await deleteTask(taskId);
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((col) =>
                col.id === columnId
                  ? {
                      ...col,
                      tasks: col.tasks.filter((task) => task.id !== taskId),
                    }
                  : col
              ),
            }
          : prev
      );
    } catch (err) {
      setError("Failed to remove task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    board,
    loading,
    error,
    fetchBoardData,
    updateBoard,
    getColumnById,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleUpdateTaskTitle,
    handleUpdateTask,
    handleRemoveTask,
  };
};
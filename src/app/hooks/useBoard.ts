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
  addTask,
  supabase,
} from "../lib/api";
import { Task, Column, Board } from "../types/useBoardTypes";

/**
 * Custom hook for managing board state and operations.
 * @param {string | null} boardId - The ID of the board to manage.
 * @returns {{
 *   board: Board | null,
 *   loading: boolean,
 *   error: string | null,
 *   fetchBoardData: () => Promise<void>,
 *   updateBoard: (updatedBoard: Board) => void,
 *   getColumnById: (columnId: string) => Column | undefined,
 *   handleUpdateBoardTitle: (newTitle: string) => Promise<void>,
 *   handleAddColumn: (title: string) => Promise<void>,
 *   handleRemoveColumn: (columnId: string) => Promise<void>,
 *   handleUpdateColumnTitle: (columnId: string, newTitle: string) => Promise<void>,
 *   handleUpdateTaskTitle: (columnId: string, taskId: string, newTitle: string) => Promise<void>,
 *   handleUpdateTask: (taskId: string, updatedTask: Partial<Task> & { column_id?: string }) => Promise<void>,
 *   handleRemoveTask: (columnId: string, taskId: string) => Promise<void>,
 *   handleAddTask: (columnId: string, title: string, priority?: string, assigneeId?: string) => Promise<Task>,
 *   teamMembers: any[]
 * }}
 */
export const useBoard = (boardId: string | null) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  /**
   * Fetch team members associated with the board.
   * @returns {Promise<void>}
   */
  const fetchTeamMembers = async () => {
    if (!boardId) return; // Exit if boardId is null

    try {
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from("team_members")
        .select("user_id, users(id, name, email, image)") // Fetch user data
        .eq("team_id", boardId);

      if (teamMembersError) {
        console.error("Error fetching team members:", teamMembersError);
        setError("Failed to load team members. Please try again.");
        return;
      }

      if (!teamMembersData || teamMembersData.length === 0) {
        console.warn("No team members found for boardId:", boardId);
        setTeamMembers([]);
        return;
      }

      // Extract user data from the nested 'users' object
      const members = teamMembersData.map((item) => ({
        user_id: item.user_id,
        ...item.users,
      }));

      setTeamMembers(members);
      setError(null);
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError("Failed to load team members. Please try again.");
    }
  };

  /**
   * Fetch the board data from the API and update state.
   * Normalizes task assignees to single user if stored as array.
   * Does nothing if no boardId is provided.
   * Sets loading and error states accordingly.
   * @returns {Promise<void>}
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
            column_id: task.column_id || col.id,
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

  useEffect(() => {
    const fetchData = async () => {
      await fetchBoardData();
      await fetchTeamMembers();
    };

    fetchData();
  }, [boardId]);

  /**
   * Replace the entire board state with a new one.
   * @param {Board} updatedBoard - New board data to set.
   */
  const updateBoard = (updatedBoard: Board) => {
    setBoard(updatedBoard);
  };

  /**
   * Get a column by its ID from current board state.
   * @param {string} columnId - ID of the column to find.
   * @returns {Column | undefined} Found column or undefined if not found.
   */
  const getColumnById = (columnId: string): Column | undefined => {
    return board?.columns.find((col) => col.id === columnId);
  };

  /**
   * Update the board's title both locally and on the server.
   * Does nothing if new title is empty or unchanged.
   * @param {string} newTitle - New title for the board.
   * @returns {Promise<void>}
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
   * Add a new column to the current board.
   * Updates local state with the new column after server response.
   * Ignores empty titles.
   * @param {string} title - Title for the new column.
   * @returns {Promise<void>}
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
   * Remove a column by its ID both from the server and local state.
   * @param {string} columnId - ID of the column to remove.
   * @returns {Promise<void>}
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
   * Update a column's title on server and local state.
   * Ignores empty titles.
   * @param {string} columnId - ID of the column to update.
   * @param {string} newTitle - New title for the column.
   * @returns {Promise<void>}
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
   * Update a task's title inside a specific column.
   * Ignores empty titles.
   * @param {string} columnId - ID of the column containing the task.
   * @param {string} taskId - ID of the task to update.
   * @param {string} newTitle - New title for the task.
   * @returns {Promise<void>}
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
   * Update the full task object on the server and locally.
   * @param {string} taskId - ID of the task to update.
   * @param {Partial<Task> & { column_id?: string }} updatedTask - Updated task object (partial).
   * @returns {Promise<void>}
   */
  const handleUpdateTask = async (
    taskId: string,
    updatedTask: Partial<Task> & { column_id?: string }
  ) => {
    if (!board) return;

    setLoading(true);
    setError(null);

    try {
      // Update local state immediately for better UX
      const { column_id, ...taskUpdates } = updatedTask;

      const newColumns = board.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === taskId ? { ...task, ...taskUpdates } : task
        ),
      }));

      updateBoard({
        ...board,
        columns: newColumns,
      });

      // Then update server if we have task data to update
      if (updatedTask.title || updatedTask.description || updatedTask.priority) {
        await updateTask(taskId, {
          title: updatedTask.title || "",
          description: updatedTask.description,
          priority: updatedTask.priority,
        });
      }

      // If column_id changed, update that separately
      if (updatedTask.column_id) {
        const { error } = await supabase
          .from("tasks")
          .update({ column_id: updatedTask.column_id })
          .eq("id", taskId);

        if (error) throw error;
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
      // Revert local changes by refetching
      await fetchBoardData();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a task by ID from a specified column.
   * @param {string} columnId - ID of the column containing the task.
   * @param {string} taskId - ID of the task to remove.
   * @returns {Promise<void>}
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

  /**
   * Add a new task to a specified column with optional priority and assignee ID.
   * Throws if title is empty.
   * Updates local state after successful creation.
   * @param {string} columnId - ID of the column to add task to.
   * @param {string} title - Title of the new task.
   * @param {string} [priority] - Optional priority ID.
   * @param {string} [assigneeId] - Optional assignee ID.
   * @returns {Promise<Task>} The newly created task.
   * @throws Will throw if the title is empty or request fails.
   */
  const handleAddTask = async (
    columnId: string,
    title: string,
    priority?: string,
    assigneeId?: string
  ): Promise<Task> => {
    try {
      console.log("=== DEBUG handleAddTask ===");
      console.log("handleAddTask called with:", {
        columnId,
        title,
        priority,
        assigneeId,
      });
      console.log("assigneeId type:", typeof assigneeId);
      console.log("assigneeId is null/undefined:", assigneeId == null);

      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert({
          title,
          column_id: columnId,
          board_id: boardId,
          priority: priority || "medium",
          user_id: assigneeId, // This should be the user ID
          order: 0,
          completed: false,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error adding task:", error);
        throw error;
      }

      console.log("Task created successfully:", newTask);
      console.log("newTask.user_id:", newTask.user_id); // Check if user_id was saved

      // Fetch assignee data if assigneeId is provided
      if (assigneeId && newTask) {
        console.log("Fetching assignee data for ID:", assigneeId);
        const { data: assigneeData, error: assigneeError } = await supabase
          .from("users")
          .select("id, name, email, image")
          .eq("id", assigneeId)
          .single();

        if (assigneeError) {
          console.error("Error fetching assignee data:", assigneeError);
        } else {
          console.log("Assignee data fetched:", assigneeData);
          newTask.assignee = assigneeData;
        }
      }

      return newTask;
    } catch (error) {
      console.error("Error in handleAddTask:", error);
      throw error;
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
    handleAddTask,
    teamMembers,
  };
};

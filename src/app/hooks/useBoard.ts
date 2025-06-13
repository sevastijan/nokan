// src/app/hooks/useBoard.ts
"use client";

import { useCallback } from "react";
import {
  useGetBoardQuery,
  useAddTaskMutation,
  useAddColumnMutation,
  useRemoveColumnMutation,
  useUpdateColumnTitleMutation,
  useRemoveTaskMutation,
  useUpdateTaskMutation,
  useUpdateBoardTitleMutation,
} from "@/app/store/apiSlice";
import { Board, Task, Column as ColumnType } from "@/app/types/globalTypes";
import { supabase } from "@/app/lib/supabase"; // dodane dla reorder
import { toast } from "react-toastify";

/**
 * Hook to manage a board via RTK Query.
 *
 * - Fetch board data via useGetBoardQuery.
 * - Provide handler functions for mutations:
 *   add/remove columns, add/remove tasks, update columns/tasks, update board title, reorder, etc.
 */
export const useBoard = (boardId: string | null) => {
  // Fetch the board data; skip query if boardId is falsy
  const {
    data: board,
    isLoading,
    error,
    refetch: fetchBoardData,
  } = useGetBoardQuery(boardId ?? "", {
    skip: !boardId,
  });

  // Prepare mutation hooks
  const [addTaskMutation] = useAddTaskMutation();
  const [addColumnMutation] = useAddColumnMutation();
  const [removeColumnMutation] = useRemoveColumnMutation();
  const [updateColumnTitleMutation] = useUpdateColumnTitleMutation();
  const [removeTaskMutation] = useRemoveTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();
  const [updateBoardTitleMutation] = useUpdateBoardTitleMutation();

  /**
   * Handler to update board title.
   * After update, refetch board.
   */
  const handleUpdateBoardTitle = useCallback(
    async (newTitle: string) => {
      if (!boardId) throw new Error("Board ID is missing");
      await updateBoardTitleMutation({ boardId, title: newTitle }).unwrap();
      // refetch to get fresh data (e.g. updated title)
      fetchBoardData();
    },
    [boardId, updateBoardTitleMutation, fetchBoardData]
  );

  /**
   * Handler to add a new task in given column.
   * After successful mutation, refetch board.
   */
  const handleAddTask = useCallback(
    async (
      columnId: string,
      title: string,
      priority?: string,
      userId?: string
    ): Promise<Task> => {
      if (!boardId) {
        throw new Error("Board ID is missing");
      }
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      // Compute next order based on current tasks in that column (if available)
      const nextOrder =
        board?.columns?.find((col) => col.id === columnId)?.tasks?.length ?? 0;

      const newTask = await addTaskMutation({
        column_id: columnId,
        title,
        board_id: boardId,
        priority: priority ?? null,
        user_id: userId ?? null,
        order: nextOrder,
      }).unwrap();

      // refetch board so UI updates
      fetchBoardData();
      return newTask;
    },
    [boardId, addTaskMutation, board?.columns, fetchBoardData]
  );

  /**
   * Handler to add a new column.
   * After successful mutation, refetch board.
   */
  const handleAddColumn = useCallback(
    async (title: string) => {
      if (!boardId) {
        throw new Error("Board ID is missing");
      }
      // next order = current number of columns
      const nextOrder = board?.columns?.length ?? 0;
      await addColumnMutation({
        board_id: boardId,
        title,
        order: nextOrder,
      }).unwrap();
      fetchBoardData();
    },
    [boardId, board?.columns, addColumnMutation, fetchBoardData]
  );

  /**
   * Handler to remove a column.
   * After removal, refetch board.
   */
  const handleRemoveColumn = useCallback(
    async (columnId: string) => {
      await removeColumnMutation({ columnId }).unwrap();
      fetchBoardData();
    },
    [removeColumnMutation, fetchBoardData]
  );

  /**
   * Handler to update a column's title.
   * After update, refetch board.
   */
  const handleUpdateColumnTitle = useCallback(
    async (columnId: string, newTitle: string) => {
      await updateColumnTitleMutation({ columnId, title: newTitle }).unwrap();
      fetchBoardData();
    },
    [updateColumnTitleMutation, fetchBoardData]
  );

  /**
   * Handler to remove a task.
   * After removal, refetch board.
   */
  const handleRemoveTask = useCallback(
    async (columnId: string, taskId: string) => {
      await removeTaskMutation({ taskId, columnId }).unwrap();
      fetchBoardData();
    },
    [removeTaskMutation, fetchBoardData]
  );

  /**
   * Handler to update a task (partial fields).
   * After update, refetch board.
   */
  const handleUpdateTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      await updateTaskMutation({ taskId, data }).unwrap();
      fetchBoardData();
    },
    [updateTaskMutation, fetchBoardData]
  );

  /**
   * Handler do zmiany kolejności kolumn.
   * newColumns: tablica ColumnType w nowej kolejności.
   * Aktualizuje w Supabase pole `order` dla każdej kolumny zgodnie z indexem w tablicy.
   * Po udanej aktualizacji odświeża board.
   */
  const handleReorderColumns = useCallback(
    async (newColumns: ColumnType[]) => {
      try {
        await Promise.all(
          newColumns.map(async (col, idx) => {
            // Zakładamy pole `order` w tabeli columns. Jeśli masz `sort_order`, zmień na { sort_order: idx }.
            const { error } = await supabase
              .from("columns")
              .update({ order: idx })
              .eq("id", col.id);
            if (error) throw error;
          })
        );
        // odświeżenie danych
        fetchBoardData();
      } catch (err: any) {
        console.error("[useBoard.handleReorderColumns] error:", err);
        toast.error("Failed to save column order");
        // cofnięcie: ponowne pobranie, by UI wróciło do stanu z serwera
        fetchBoardData();
      }
    },
    [fetchBoardData]
  );

  /**
   * Handler do zmiany kolejności zadań w obrębie jednej kolumny.
   * newTasksOrder: tablica Task w nowej kolejności.
   * Aktualizuje w Supabase pole `sort_order` (zakładając, że tak nazywa się kolumna w tabeli tasks).
   * Po udanej aktualizacji odświeża board.
   */
  const handleReorderTasks = useCallback(
    async (columnId: string, newTasksOrder: Task[]) => {
      try {
        await Promise.all(
          newTasksOrder.map(async (task, idx) => {
            const { error } = await supabase
              .from("tasks")
              .update({ sort_order: idx })
              .eq("id", task.id);
            if (error) throw error;
          })
        );
        fetchBoardData();
      } catch (err: any) {
        console.error("[useBoard.handleReorderTasks] error:", err);
        toast.error("Failed to save task order");
        fetchBoardData();
      }
    },
    [fetchBoardData]
  );

  return {
    board, // Board | undefined
    loading: isLoading, // boolean indicating loading state
    error, // unknown or error object
    fetchBoardData, // function to manually refetch board
    handleUpdateBoardTitle, // (newTitle: string) => Promise<void>
    handleAddTask, // (columnId, title, priority?, userId?) => Promise<Task>
    handleAddColumn, // (title) => Promise<void>
    handleRemoveColumn, // (columnId) => Promise<void>
    handleUpdateColumnTitle, // (columnId, newTitle) => Promise<void>
    handleRemoveTask, // (columnId, taskId) => Promise<void>
    handleUpdateTask, // (taskId, data) => Promise<void>
    handleReorderColumns, // (newColumns: ColumnType[]) => Promise<void>
    handleReorderTasks, // (columnId: string, newTasksOrder: Task[]) => Promise<void>
  };
};

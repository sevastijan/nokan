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
  useAddStarterTaskMutation,
  useLazyGetTemplateTasksQuery,
} from "@/app/store/apiSlice";
import { Board, Task } from "@/app/types/globalTypes";

/**
 * Custom hook for fetching and managing board state.
 */
export const useBoard = (boardId: string) => {
  const {
    data: board,
    isLoading,
    error,
    refetch: fetchBoardData,
  } = useGetBoardQuery(boardId, { skip: !boardId });

  const [addTask] = useAddTaskMutation();
  const [addColumn] = useAddColumnMutation();
  const [removeColumn] = useRemoveColumnMutation();
  const [updateColumnTitle] = useUpdateColumnTitleMutation();
  const [removeTask] = useRemoveTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [updateBoardTitle] = useUpdateBoardTitleMutation();

  // New: Mutations/queries for starter tasks from template
  const [addStarterTask] = useAddStarterTaskMutation();
  const [triggerGetTemplateTasks] = useLazyGetTemplateTasksQuery();

  /**
   * Update board title.
   */
  const handleUpdateBoardTitle = useCallback(
    async (title: string) => {
      await updateBoardTitle({ boardId, title }).unwrap();
      fetchBoardData();
    },
    [boardId, updateBoardTitle, fetchBoardData]
  );

  /**
   * Add new task to a column.
   */
  const handleAddTask = useCallback(
    async (
      column_id: string,
      title: string,
      priority?: string,
      user_id?: string
    ): Promise<Task> => {
      const nextOrder =
        board?.columns.find((c) => c.id === column_id)?.tasks.length || 0;
      const task = await addTask({
        column_id,
        board_id: boardId,
        title,
        priority: priority || null,
        user_id: user_id || null,
        order: nextOrder,
      }).unwrap();
      fetchBoardData();
      return task;
    },
    [board, boardId, addTask, fetchBoardData]
  );

  /**
   * Add new column to the board.
   */
  const handleAddColumn = useCallback(
    async (title: string) => {
      const nextOrder = board?.columns.length || 0;
      await addColumn({ board_id: boardId, title, order: nextOrder }).unwrap();
      fetchBoardData();
    },
    [board, boardId, addColumn, fetchBoardData]
  );

  /**
   * Remove column and its tasks.
   */
  const handleRemoveColumn = useCallback(
    async (columnId: string) => {
      await removeColumn({ columnId }).unwrap();
      fetchBoardData();
    },
    [removeColumn, fetchBoardData]
  );

  /**
   * Update column title.
   */
  const handleUpdateColumnTitle = useCallback(
    async (columnId: string, title: string) => {
      await updateColumnTitle({ columnId, title }).unwrap();
      fetchBoardData();
    },
    [updateColumnTitle, fetchBoardData]
  );

  /**
   * Remove a task from a column.
   */
  const handleRemoveTask = useCallback(
    async (columnId: string, taskId: string) => {
      await removeTask({ columnId, taskId }).unwrap();
      fetchBoardData();
    },
    [removeTask, fetchBoardData]
  );

  /**
   * Update a task's fields.
   */
  const handleUpdateTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      await updateTask({ taskId, data }).unwrap();
      fetchBoardData();
    },
    [updateTask, fetchBoardData]
  );

  /**
   * Reorder tasks inside a column.
   */
  const handleReorderTasks = useCallback(
    async (columnId: string, tasks: Task[]) => {
      await Promise.all(
        tasks.map((t, i) =>
          updateTask({ taskId: t.id, data: { order: i } }).unwrap()
        )
      );
      fetchBoardData();
    },
    [updateTask, fetchBoardData]
  );

  /**
   * Add starter tasks to a board from template.
   * This is for cases where you want to seed a board with tasks from a template_tasks table.
   */
  const handleAddStarterTasksFromTemplate = useCallback(
    async (boardId: string, templateId: string) => {
      // Fetch template tasks for the given templateId
      const { data: templateTasks } = await triggerGetTemplateTasks(
        templateId,
        true // preferCacheValue = true, or just pass templateId
      );

      if (templateTasks && Array.isArray(templateTasks)) {
        // Insert each starter task into "tasks" for the board (can use addStarterTask mutation if you have it)
        await Promise.all(
          templateTasks.map((templateTask) =>
            addStarterTask({
              board_id: boardId,
              ...templateTask,
            }).unwrap()
          )
        );
        fetchBoardData();
      }
    },
    [addStarterTask, triggerGetTemplateTasks, fetchBoardData]
  );

  return {
    board,
    loading: isLoading,
    error,
    fetchBoardData,
    handleUpdateBoardTitle,
    handleAddTask,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleRemoveTask,
    handleUpdateTask,
    handleReorderTasks,
    handleAddStarterTasksFromTemplate, // <-- expose starter tasks logic
  };
};

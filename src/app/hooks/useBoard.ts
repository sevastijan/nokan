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
import { Board, Task } from "@/app/types/globalTypes";

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
  const [updColTitle] = useUpdateColumnTitleMutation();
  const [removeTask] = useRemoveTaskMutation();
  const [updTask] = useUpdateTaskMutation();
  const [updBoardTitle] = useUpdateBoardTitleMutation();

  const handleUpdateBoardTitle = useCallback(
    async (title: string) => {
      await updBoardTitle({ boardId, title }).unwrap();
      fetchBoardData();
    },
    [boardId, updBoardTitle, fetchBoardData]
  );

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

  const handleAddColumn = useCallback(
    async (title: string) => {
      const nextOrder = board?.columns.length || 0;
      await addColumn({ board_id: boardId, title, order: nextOrder }).unwrap();
      fetchBoardData();
    },
    [board, boardId, addColumn, fetchBoardData]
  );

  const handleRemoveColumn = useCallback(
    async (columnId: string) => {
      await removeColumn({ columnId }).unwrap();
      fetchBoardData();
    },
    [removeColumn, fetchBoardData]
  );

  const handleUpdateColumnTitle = useCallback(
    async (columnId: string, title: string) => {
      await updColTitle({ columnId, title }).unwrap();
      fetchBoardData();
    },
    [updColTitle, fetchBoardData]
  );

  const handleRemoveTask = useCallback(
    async (columnId: string, taskId: string) => {
      await removeTask({ columnId, taskId }).unwrap();
      fetchBoardData();
    },
    [removeTask, fetchBoardData]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, data: Partial<Task>) => {
      await updTask({ taskId, data }).unwrap();
      fetchBoardData();
    },
    [updTask, fetchBoardData]
  );

  const handleReorderTasks = useCallback(
    async (columnId: string, tasks: Task[]) => {
      await Promise.all(
        tasks.map((t, i) =>
          updTask({ taskId: t.id, data: { order: i } }).unwrap()
        )
      );
      fetchBoardData();
    },
    [updTask, fetchBoardData]
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
  };
};

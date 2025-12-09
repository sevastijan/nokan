'use client';

import { useCallback, useEffect, useState } from 'react';
import {
     useGetBoardQuery,
     useAddTaskMutation,
     useAddColumnMutation,
     useRemoveColumnMutation,
     useUpdateColumnTitleMutation,
     useRemoveTaskMutation,
     useUpdateTaskMutation,
     useUpdateBoardTitleMutation,
} from '@/app/store/apiSlice';
import { Task } from '@/app/types/globalTypes';

export interface Status {
     id: string;
     board_id: string;
     label: string;
     color: string;
     order_index: number;
}

/**
 * Custom hook for fetching and managing board state.
 */
export const useBoard = (boardId: string) => {
     const [statuses, setStatuses] = useState<Status[]>([]);
     const [loadingStatuses, setLoadingStatuses] = useState(true);

     const {
          data: board,
          isLoading,
          error,
          refetch: fetchBoardData,
     } = useGetBoardQuery(boardId, {
          skip: !boardId,
     });

     const [addTask] = useAddTaskMutation();
     const [addColumn] = useAddColumnMutation();
     const [removeColumn] = useRemoveColumnMutation();
     const [updateColumnTitle] = useUpdateColumnTitleMutation();
     const [removeTask] = useRemoveTaskMutation();
     const [updateTask] = useUpdateTaskMutation();
     const [updateBoardTitle] = useUpdateBoardTitleMutation();

     useEffect(() => {
          if (!boardId) return;

          const fetchStatuses = async () => {
               try {
                    setLoadingStatuses(true);
                    const response = await fetch(`/api/statuses?board_id=${boardId}`);
                    if (response.ok) {
                         const data = await response.json();
                         setStatuses(data);
                    } else {
                         console.error('❌ Failed to fetch statuses');
                         setStatuses([]);
                    }
               } catch (error) {
                    console.error('❌ Error fetching statuses:', error);
                    setStatuses([]);
               } finally {
                    setLoadingStatuses(false);
               }
          };

          fetchStatuses();
     }, [boardId]);

     const handleUpdateBoardTitle = useCallback(
          async (title: string) => {
               await updateBoardTitle({ boardId, title }).unwrap();
               fetchBoardData();
          },
          [boardId, updateBoardTitle, fetchBoardData],
     );

     const handleAddTask = useCallback(
          async (column_id: string, title: string, priority?: string, user_id?: string): Promise<Task> => {
               const nextOrder = board?.columns.find((c) => c.id === column_id)?.tasks.length || 0;

               const defaultStatusId = statuses.length > 0 ? statuses[0].id : null;

               const task = await addTask({
                    column_id,
                    board_id: boardId,
                    title,
                    priority: priority || null,
                    user_id: user_id || null,
                    status_id: defaultStatusId,
                    order: nextOrder,
               }).unwrap();
               fetchBoardData();
               return task;
          },
          [board, boardId, statuses, addTask, fetchBoardData],
     );

     const handleAddColumn = useCallback(
          async (title: string) => {
               const nextOrder = board?.columns.length || 0;
               await addColumn({ board_id: boardId, title, order: nextOrder }).unwrap();
               fetchBoardData();
          },
          [board, boardId, addColumn, fetchBoardData],
     );

     const handleRemoveColumn = useCallback(
          async (columnId: string) => {
               await removeColumn({ columnId }).unwrap();
               fetchBoardData();
          },
          [removeColumn, fetchBoardData],
     );

     const handleUpdateColumnTitle = useCallback(
          async (columnId: string, title: string) => {
               await updateColumnTitle({ columnId, title }).unwrap();
               fetchBoardData();
          },
          [updateColumnTitle, fetchBoardData],
     );

     const handleRemoveTask = useCallback(
          async (columnId: string, taskId: string) => {
               await removeTask({ columnId, taskId }).unwrap();
               fetchBoardData();
          },
          [removeTask, fetchBoardData],
     );

     const handleUpdateTask = useCallback(
          async (taskId: string, data: Partial<Task>) => {
               await updateTask({ taskId, data }).unwrap();
               fetchBoardData();
          },
          [updateTask, fetchBoardData],
     );

     const handleReorderTasks = useCallback(
          async (columnId: string, tasks: Task[]) => {
               await Promise.all(tasks.map((t, i) => updateTask({ taskId: t.id, data: { order: i } }).unwrap()));
               fetchBoardData();
          },
          [updateTask, fetchBoardData],
     );

     return {
          board,
          statuses,
          loading: isLoading || loadingStatuses,
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

export default useBoard;

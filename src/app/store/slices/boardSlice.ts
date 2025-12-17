import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Board, Column, Task } from '@/app/types/globalTypes';

interface BoardsState {
     boards: Board[];
}

const initialState: BoardsState = {
     boards: [],
};

/**
 * Redux slice for managing boards, columns, and tasks.
 */
const boardSlice = createSlice({
     name: 'boards',
     initialState,
     reducers: {
          /**
           * Adds a new board.
           */
          addBoard: (state, action: PayloadAction<string>) => {
               const newBoard: Board = {
                    id: uuidv4(),
                    title: action.payload,
                    user_id: '', // Will be set on server or after creation
                    statuses: [], // Default empty statuses
                    columns: [],
               };

               state.boards.push(newBoard);
          },

          /**
           * Removes a board by its ID.
           */
          removeBoard: (state, action: PayloadAction<string>) => {
               state.boards = state.boards.filter((b) => b.id !== action.payload);
          },

          /**
           * Adds a new column to a board.
           */
          addColumn: (state, action: PayloadAction<{ boardId: string; columnTitle: string }>) => {
               const board = state.boards.find((b) => b.id === action.payload.boardId);
               if (board) {
                    const newColumn: Column = {
                         id: uuidv4(),
                         title: action.payload.columnTitle,
                         boardId: board.id,
                         order: board.columns.length,
                         tasks: [],
                    };

                    board.columns.push(newColumn);
               }
          },

          /**
           * Removes a column from a board.
           */
          removeColumn: (state, action: PayloadAction<{ boardId: string; columnId: string }>) => {
               const board = state.boards.find((b) => b.id === action.payload.boardId);
               if (board) {
                    board.columns = board.columns.filter((c) => c.id !== action.payload.columnId);
               }
          },

          /**
           * Reorders columns within a board.
           */
          reorderColumns: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    sourceIndex: number;
                    destinationIndex: number;
               }>,
          ) => {
               const { boardId, sourceIndex, destinationIndex } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               if (!board) return;

               const [removed] = board.columns.splice(sourceIndex, 1);
               board.columns.splice(destinationIndex, 0, removed);

               // Update order indices after reorder
               board.columns.forEach((col, index) => {
                    col.order = index;
               });
          },

          /**
           * Reorders tasks within a column.
           */
          reorderTasks: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    columnId: string;
                    sourceIndex: number;
                    destinationIndex: number;
               }>,
          ) => {
               const { boardId, columnId, sourceIndex, destinationIndex } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               if (!board) return;

               const column = board.columns.find((c) => c.id === columnId);
               if (!column) return;

               const [removed] = column.tasks.splice(sourceIndex, 1);
               column.tasks.splice(destinationIndex, 0, removed);
          },

          /**
           * Moves a task between columns.
           */
          moveTaskBetweenColumns: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    sourceColumnId: string;
                    destColumnId: string;
                    sourceIndex: number;
                    destinationIndex: number;
               }>,
          ) => {
               const { boardId, sourceColumnId, destColumnId, sourceIndex, destinationIndex } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               if (!board) return;

               const sourceColumn = board.columns.find((c) => c.id === sourceColumnId);
               const destColumn = board.columns.find((c) => c.id === destColumnId);
               if (!sourceColumn || !destColumn) return;

               const [movedTask] = sourceColumn.tasks.splice(sourceIndex, 1);
               destColumn.tasks.splice(destinationIndex, 0, movedTask);
          },

          /**
           * Moves a task between columns with specific task ID.
           */
          moveTask: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    sourceColumnId: string;
                    destinationColumnId: string;
                    taskId: string;
                    destinationIndex: number;
               }>,
          ) => {
               const { boardId, sourceColumnId, destinationColumnId, taskId, destinationIndex } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               if (!board) return;

               const sourceColumn = board.columns.find((c) => c.id === sourceColumnId);
               const destinationColumn = board.columns.find((c) => c.id === destinationColumnId);
               if (!sourceColumn || !destinationColumn) return;

               const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId);
               if (taskIndex === -1) return;

               const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
               destinationColumn.tasks.splice(destinationIndex, 0, movedTask);
          },

          /**
           * Adds a new task to a column.
           */
          addTask: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    columnId: string;
                    taskTitle: string;
               }>,
          ) => {
               const { boardId, columnId, taskTitle } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               const column = board?.columns.find((c) => c.id === columnId);

               if (column) {
                    const newTaskOrder = column.tasks.length;

                    const newTask: Task = {
                         id: uuidv4(),
                         title: taskTitle,
                         description: '',
                         column_id: columnId,
                         board_id: boardId,
                         sort_order: column.tasks.length,
                         order: newTaskOrder,
                         priority: 'medium',
                         completed: false,
                         created_at: new Date().toISOString(),
                         updated_at: new Date().toISOString(),
                    };

                    column.tasks.push(newTask);
               }
          },

          /**
           * Edits the title of a task.
           */
          editTask: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    columnId: string;
                    taskId: string;
                    newTitle: string;
               }>,
          ) => {
               const { boardId, columnId, taskId, newTitle } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               const column = board?.columns.find((c) => c.id === columnId);
               const task = column?.tasks.find((t) => t.id === taskId);

               if (task) {
                    task.title = newTitle;
                    task.updated_at = new Date().toISOString();
               }
          },

          /**
           * Removes a task from a column.
           */
          removeTask: (
               state,
               action: PayloadAction<{
                    boardId: string;
                    columnId: string;
                    taskId: string;
               }>,
          ) => {
               const { boardId, columnId, taskId } = action.payload;
               const board = state.boards.find((b) => b.id === boardId);
               const column = board?.columns.find((c) => c.id === columnId);

               if (column) {
                    column.tasks = column.tasks.filter((t) => t.id !== taskId);
               }
          },
     },
});

export const { addBoard, removeBoard, addColumn, removeColumn, addTask, editTask, removeTask, reorderColumns, reorderTasks, moveTaskBetweenColumns, moveTask } = boardSlice.actions;

export default boardSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { Board } from "../types";

interface BoardsState {
  boards: Board[];
}

const initialState: BoardsState = {
  boards: [],
};

const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    addBoard: (state, action: PayloadAction<string>) => {
      state.boards.push({
        id: uuidv4(),
        title: action.payload,
        columns: [],
      });
    },
    removeBoard: (state, action: PayloadAction<string>) => {
      state.boards = state.boards.filter((b) => b.id !== action.payload);
    },

    addColumn: (
      state,
      action: PayloadAction<{ boardId: string; columnTitle: string }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      if (board) {
        board.columns.push({
          id: uuidv4(),
          title: action.payload.columnTitle,
          tasks: [],
        });
      }
    },
    removeColumn: (
      state,
      action: PayloadAction<{ boardId: string; columnId: string }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      if (board) {
        board.columns = board.columns.filter(
          (c) => c.id !== action.payload.columnId
        );
      }
    },

    reorderColumns: (
      state,
      action: PayloadAction<{
        boardId: string;
        sourceIndex: number;
        destinationIndex: number;
      }>
    ) => {
      const { boardId, sourceIndex, destinationIndex } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return;
      const [removed] = board.columns.splice(sourceIndex, 1);
      board.columns.splice(destinationIndex, 0, removed);
    },

    reorderTasks: (
      state,
      action: PayloadAction<{
        boardId: string;
        columnId: string;
        sourceIndex: number;
        destinationIndex: number;
      }>
    ) => {
      const { boardId, columnId, sourceIndex, destinationIndex } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return;
      const column = board.columns.find((c) => c.id === columnId);
      if (!column) return;
      const [removed] = column.tasks.splice(sourceIndex, 1);
      column.tasks.splice(destinationIndex, 0, removed);
    },

    moveTaskBetweenColumns: (
      state,
      action: PayloadAction<{
        boardId: string;
        sourceColumnId: string;
        destColumnId: string;
        sourceIndex: number;
        destinationIndex: number;
      }>
    ) => {
      const {
        boardId,
        sourceColumnId,
        destColumnId,
        sourceIndex,
        destinationIndex,
      } = action.payload;
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return;
      const sourceColumn = board.columns.find((c) => c.id === sourceColumnId);
      const destColumn = board.columns.find((c) => c.id === destColumnId);
      if (!sourceColumn || !destColumn) return;

      const [movedTask] = sourceColumn.tasks.splice(sourceIndex, 1);
      destColumn.tasks.splice(destinationIndex, 0, movedTask);
    },

    moveTask: (
      state,
      action: PayloadAction<{
        boardId: string;
        sourceColumnId: string;
        destinationColumnId: string;
        taskId: string;
        destinationIndex: number;
      }>
    ) => {
      const { boardId, sourceColumnId, destinationColumnId, taskId, destinationIndex } = action.payload;
      const board = state.boards.find(b => b.id === boardId);
      if (!board) return;

      const sourceColumn = board.columns.find(c => c.id === sourceColumnId);
      const destinationColumn = board.columns.find(c => c.id === destinationColumnId);
      if (!sourceColumn || !destinationColumn) return;

      const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;

      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
      destinationColumn.tasks.splice(destinationIndex, 0, movedTask);
    },

    addTask: (
      state,
      action: PayloadAction<{
        boardId: string;
        columnId: string;
        taskTitle: string;
      }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      const column = board?.columns.find((c) => c.id === action.payload.columnId);
      if (column) {
        column.tasks.push({
          id: uuidv4(),
          title: action.payload.taskTitle,
        });
      }
    },

    editTask: (
      state,
      action: PayloadAction<{
        boardId: string;
        columnId: string;
        taskId: string;
        newTitle: string;
      }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      const column = board?.columns.find((c) => c.id === action.payload.columnId);
      const task = column?.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.title = action.payload.newTitle;
      }
    },

    removeTask: (
      state,
      action: PayloadAction<{
        boardId: string;
        columnId: string;
        taskId: string;
      }>
    ) => {
      const board = state.boards.find((b) => b.id === action.payload.boardId);
      const column = board?.columns.find((c) => c.id === action.payload.columnId);
      if (column) {
        column.tasks = column.tasks.filter((t) => t.id !== action.payload.taskId);
      }
    },
  },
});

export const {
  addBoard,
  removeBoard,
  addColumn,
  removeColumn,
  addTask,
  editTask,
  removeTask,
  reorderColumns,
  reorderTasks,
  moveTaskBetweenColumns,
  moveTask,
} = boardSlice.actions;

export default boardSlice.reducer;

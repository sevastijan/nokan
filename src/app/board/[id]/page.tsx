"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import { useState } from "react";

/**
 * Component representing the board page.
 *
 * @returns {JSX.Element} The rendered BoardPage component.
 */
const BoardPage = () => {
  const { id } = useParams();
  const {
    board,
    loading,
    error,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleUpdateTaskTitle,
    handleRemoveTask,
  } = useBoard(id as string);

  const [newColumnTitle, setNewColumnTitle] = useState("");

  /**
   * Handles drag-and-drop events for tasks and columns.
   *
   * @param {Object} result - The result of the drag-and-drop action.
   */
  const onDragEnd = (result: any) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "TASK") {
      const sourceCol = board.columns.find(
        (col: any) => col.id === source.droppableId
      );
      const destCol = board.columns.find(
        (col: any) => col.id === destination.droppableId
      );

      if (!sourceCol || !destCol) return;

      const taskToMove = sourceCol.tasks[source.index];

      if (source.droppableId === destination.droppableId) {
        const newTasks = [...sourceCol.tasks];
        newTasks.splice(source.index, 1);
        newTasks.splice(destination.index, 0, taskToMove);

        setBoard((prev: any) => ({
          ...prev,
          columns: prev.columns.map((col: any) =>
            col.id === sourceCol.id ? { ...col, tasks: newTasks } : col
          ),
        }));
      } else {
        const sourceTasks = [...sourceCol.tasks];
        const destTasks = [...destCol.tasks];

        sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, taskToMove);

        setBoard((prev: any) => ({
          ...prev,
          columns: prev.columns.map((col: any) =>
            col.id === sourceCol.id
              ? { ...col, tasks: sourceTasks }
              : col.id === destCol.id
              ? { ...col, tasks: destTasks }
              : col
          ),
        }));
      }
    }
  };

  /**
   * Handles adding a new column to the board.
   */
  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    handleAddColumn(newColumnTitle);
    setNewColumnTitle("");
  };

  if (!board) return <p className="p-4">Loading...</p>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-6">
        <input
          type="text"
          value={board.title}
          onChange={(e) => handleUpdateBoardTitle(e.target.value)}
          className="text-2xl font-bold mb-4 w-full border-b-2 focus:outline-none"
        />

        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto"
            >
              {board.columns.map((column: any, colIndex: number) => (
                <Column
                  key={column.id}
                  column={column}
                  colIndex={colIndex}
                  onUpdateColumnTitle={handleUpdateColumnTitle}
                  onRemoveColumn={handleRemoveColumn}
                  onTaskAdded={(newTask: any) => handleAddColumn(newTask.title)}
                  onUpdateTaskTitle={handleUpdateTaskTitle}
                  onRemoveTask={handleRemoveTask}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div className="min-w-[250px] p-4 bg-blue-50 rounded">
          <input
            type="text"
            placeholder="New column"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            className="w-full border rounded px-2 py-1 mb-2"
          />
          <button
            onClick={addColumn}
            className="bg-blue-600 text-white w-full py-1 rounded"
            disabled={loading || !newColumnTitle.trim()}
          >
            {loading ? "Adding..." : "Add Column"}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </DragDropContext>
  );
};

export default BoardPage;

"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import AddColumnPopup from "../../components/AddColumnPopup";
import { JSX, useState, useEffect } from "react";

/**
 * Component representing the board page.
 *
 * @returns {JSX.Element} The rendered BoardPage component.
 */
const BoardPage = (): JSX.Element => {
  const { id } = useParams();
  const {
    board,
    error,
    updateBoard,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleUpdateTaskTitle,
    handleRemoveTask,
  } = useBoard(id as string);

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [localBoardTitle, setLocalBoardTitle] = useState(board?.title || "");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localBoardTitle !== board?.title) {
        handleUpdateBoardTitle(localBoardTitle);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localBoardTitle, board?.title, handleUpdateBoardTitle]);

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

        updateBoard({
          ...board,
          columns: board.columns.map((col: any) =>
            col.id === sourceCol.id ? { ...col, tasks: newTasks } : col
          ),
        });
      } else {
        const sourceTasks = [...sourceCol.tasks];
        const destTasks = [...destCol.tasks];

        sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, taskToMove);

        updateBoard({
          ...board,
          columns: board.columns.map((col: any) =>
            col.id === sourceCol.id
              ? { ...col, tasks: sourceTasks }
              : col.id === destCol.id
              ? { ...col, tasks: destTasks }
              : col
          ),
        });
      }
    } else if (type === "COLUMN") {
      const newColumns = [...board.columns];
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);

      updateBoard({
        ...board,
        columns: newColumns,
      });
    }
  };

  /**
   * Handles adding a new column to the board.
   */
  const addColumn = async () => {
    if (!newColumnTitle.trim()) return;
    setIsAddingColumn(true);
    try {
      await handleAddColumn(newColumnTitle);
      setNewColumnTitle("");
      setIsPopupOpen(false);
    } finally {
      setIsAddingColumn(false);
    }
  };

  if (!board) return <p className="p-4">Loading...</p>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-6">
        <input
          type="text"
          value={localBoardTitle}
          onChange={(e) => setLocalBoardTitle(e.target.value)}
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
                  onTaskAdded={(newTask: any) =>
                    updateBoard({
                      ...board,
                      columns: board.columns.map((col: any) =>
                        col.id === column.id
                          ? { ...col, tasks: [...col.tasks, newTask] }
                          : col
                      ),
                    })
                  }
                  onUpdateTaskTitle={handleUpdateTaskTitle}
                  onRemoveTask={handleRemoveTask}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          Add Column
        </button>
        <AddColumnPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onAddColumn={addColumn}
          newColumnTitle={newColumnTitle}
          setNewColumnTitle={setNewColumnTitle}
          isAddingColumn={isAddingColumn}
        />
      </div>
    </DragDropContext>
  );
};

export default BoardPage;

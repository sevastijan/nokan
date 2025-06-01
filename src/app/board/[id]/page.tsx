"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import AddColumnPopup from "../../components/AddColumnPopup";
import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="p-6 bg-gray-900 min-h-screen">
        <input
          type="text"
          value={localBoardTitle}
          onChange={(e) => setLocalBoardTitle(e.target.value)}
          className="text-3xl font-bold mb-6 w-full bg-transparent text-white border-b-2 border-gray-600 focus:outline-none focus:border-blue-500"
          placeholder="Board Title"
        />
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-6 overflow-x-auto pb-4"
            >
              <AnimatePresence>
                {board.columns.map((column: any, colIndex: number) => (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Column
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
                  </motion.div>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md mt-4 transition-all duration-200"
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

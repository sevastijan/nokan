"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import AddColumnPopup from "../../components/AddColumnPopup";
import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Column as ColumnType, Task } from "../../types/useBoardTypes";

const BoardPage = (): JSX.Element => {
  const { id } = useParams();
  const {
    board,
    updateBoard,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleRemoveTask,
  } = useBoard(id as string);

  const [newColumnTitle, setNewColumnTitle] = useState<string>("");
  const [isAddingColumn, setIsAddingColumn] = useState<boolean>(false);
  const [localBoardTitle, setLocalBoardTitle] = useState<string>(
    board?.title || ""
  );
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

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

  const handleUpdateTask = (columnId: string, updatedTask: Task) => {
    if (!board) return;

    updateBoard({
      ...board,
      columns: board.columns.map((col: ColumnType) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((task: Task) =>
                task.id === updatedTask.id ? updatedTask : task
              ),
            }
          : col
      ),
    });
  };

  const onDragEnd = (result: any) => {
    if (!board) return;

    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "TASK") {
      const sourceCol = board.columns.find(
        (col) => col.id === source.droppableId
      );
      const destCol = board.columns.find(
        (col) => col.id === destination.droppableId
      );

      if (!sourceCol || !destCol) return;

      const taskToMove = sourceCol.tasks[source.index];

      if (source.droppableId === destination.droppableId) {
        const newTasks = [...sourceCol.tasks];
        newTasks.splice(source.index, 1);
        newTasks.splice(destination.index, 0, taskToMove);

        updateBoard({
          ...board,
          columns: board.columns.map((col) =>
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
          columns: board.columns.map((col) =>
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
      <div className="p-4 sm:p-6 bg-gray-900 min-h-screen">
        <input
          type="text"
          value={localBoardTitle}
          onChange={(e) => setLocalBoardTitle(e.target.value)}
          className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 w-full bg-transparent text-white border-b-2 border-gray-600 focus:outline-none focus:border-blue-500"
          placeholder="Board Title"
        />
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap gap-4 sm:gap-6 overflow-x-auto pb-4 justify-center sm:justify-start"
            >
              <AnimatePresence>
                {board.columns.map((column: ColumnType, colIndex: number) => (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full sm:w-auto min-w-[250px] sm:min-w-[300px]"
                  >
                    <Column
                      column={column}
                      colIndex={colIndex}
                      onUpdateColumnTitle={handleUpdateColumnTitle}
                      onRemoveColumn={handleRemoveColumn}
                      onUpdateTask={handleUpdateTask}
                      onTaskAdded={(newTask: Task) =>
                        updateBoard({
                          ...board,
                          columns: board.columns.map((col) =>
                            col.id === column.id
                              ? { ...col, tasks: [...col.tasks, newTask] }
                              : col
                          ),
                        })
                      }
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md mt-4 transition-all duration-200 w-full sm:w-auto"
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

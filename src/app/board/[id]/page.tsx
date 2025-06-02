"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useParams, useRouter } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import AddColumnPopup from "../../components/TaskColumn/AddColumnPopup";
import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Column as ColumnType, Task } from "../../types/useBoardTypes";
import { useSession } from "next-auth/react";
import Loader from "../../components/Loader";

/**
 * Board page component that displays a Kanban board with drag-and-drop functionality
 * @returns JSX element containing the board interface
 */
const Page = (): JSX.Element => {
  const { id } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const {
    board,
    updateBoard,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleRemoveTask,
    handleUpdateTask,
  } = useBoard(id as string);

  const [newColumnTitle, setNewColumnTitle] = useState<string>("");
  const [isAddingColumn, setIsAddingColumn] = useState<boolean>(false);
  const [localBoardTitle, setLocalBoardTitle] = useState<string>(
    board?.title || ""
  );
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  /**
   * Redirect unauthenticated users to sign-in page
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  /**
   * Update local board title when board data changes
   */
  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title, localBoardTitle]);

  /**
   * Debounced board title update to reduce API calls
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localBoardTitle !== board?.title) {
        handleUpdateBoardTitle(localBoardTitle);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localBoardTitle, board?.title, handleUpdateBoardTitle]);

  /**
   * Handle drag and drop operations for tasks and columns
   * @param result - The drag and drop result from react-beautiful-dnd
   */
  const onDragEnd = (result: DropResult) => {
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

  /**
   * Add a new column to the board
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

  if (status === "loading" || !board) {
    return <Loader text="Loading board..." />;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4 sm:p-6 bg-gray-900 min-h-screen">
        <div className="mb-4 flex  flex-col md:flex-row">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors m-0 max-w-[160]"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="mb-4 sm:mb-6 flex-col md:flex-row gap-4 flex md:items-center">
          <input
            type="text"
            value={localBoardTitle}
            onChange={(e) => setLocalBoardTitle(e.target.value)}
            className="text-2xl sm:text-3xl font-bold bg-transparent text-white border-b-2 border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="Board Title"
          />
          <button
            onClick={() => setIsPopupOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-all duration-200 max-w-[160] lg:w-full"
          >
            Add Column
          </button>
        </div>
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
                      onUpdateTask={handleUpdateTask}
                      colIndex={colIndex}
                      onUpdateColumnTitle={handleUpdateColumnTitle}
                      onRemoveColumn={handleRemoveColumn}
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

export default Page;

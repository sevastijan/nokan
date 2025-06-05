"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useParams, useRouter } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import AddColumnPopup from "../../components/TaskColumn/AddColumnPopup";
import SingleTaskView from "../../components/SingleTaskView/SingleTaskView";
import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { Column as ColumnType, Task } from "../../types/useBoardTypes";
import { User } from "../../components/SingleTaskView/types";
import { useSession } from "next-auth/react";
import Loader from "../../components/Loader";
import { supabase } from "../../lib/supabase";
import { getPriorities, getTeams } from "../../lib/api";

/**
 * Board page component displaying a Kanban board with drag-and-drop support
 * @returns JSX element rendering the board UI
 */
const Page = (): JSX.Element => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Custom hook for board data and handlers
  const {
    board,
    fetchBoardData,
    updateBoard,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleRemoveTask,
    handleUpdateTask,
    handleAddTask,
  } = useBoard(id as string);

  // Local state for board functionality
  const [newColumnTitle, setNewColumnTitle] = useState<string>("");
  const [isAddingColumn, setIsAddingColumn] = useState<boolean>(false);
  const [localBoardTitle, setLocalBoardTitle] = useState<string>(
    board?.title || ""
  );
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<
    Array<{ id: string; label: string; color: string }>
  >([]);

  /**
   * Fetch task priorities from API or set default priorities on failure
   */
  useEffect(() => {
    const loadPriorities = async () => {
      try {
        const fetchedPriorities = await getPriorities();
        setPriorities(fetchedPriorities);
      } catch (error) {
        console.error("Error loading priorities:", error);
        setPriorities([
          { id: "low", label: "Low", color: "#10b981" },
          { id: "medium", label: "Medium", color: "#f59e0b" },
          { id: "high", label: "High", color: "#ef4444" },
          { id: "urgent", label: "Urgent", color: "#dc2626" },
        ]);
      }
    };

    loadPriorities();
  }, []);

  /**
   * Fetch or create current user from Supabase using session email
   */
  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.email) {
        try {
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email)
            .single();

          if (userData && !error) {
            // Set user from existing database record
            const user: User = {
              id: userData.id,
              name: userData.name || session.user.name || "Unknown User",
              email: userData.email,
              image: userData.image || session.user.image || undefined,
              created_at: userData.created_at,
            };
            setCurrentUser(user);
          } else if (error?.code === "PGRST116") {
            // If user not found, create a new one in the database
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert({
                email: session.user.email,
                name: session.user.name || "Unknown User",
                image: session.user.image || null,
              })
              .select()
              .single();

            if (createError) {
              console.error("Error creating user:", createError);
              throw createError;
            }

            const user: User = {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              image: newUser.image || undefined,
              created_at: newUser.created_at,
            };
            setCurrentUser(user);
          } else {
            console.error("Database error:", error);
            throw error;
          }
        } catch (error) {
          // Fallback user object from session if DB fails
          console.error("Error fetching/creating user:", error);
          const user: User = {
            id: session.user.email || "temp-id",
            name: session.user.name || "Unknown User",
            email: session.user.email || "",
            image: session.user.image || undefined,
          };
          setCurrentUser(user);
        }
      }
    };

    if (session?.user?.email) {
      fetchUser();
    }
  }, [session]);

  /**
   * Redirect to sign-in page if user is unauthenticated
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  /**
   * Synchronize local board title state when board data updates
   */
  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title, localBoardTitle]);

  /**
   * Debounce board title updates to reduce number of API calls
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
   * Handle drag and drop events for tasks and columns
   * @param result - Result object from drag-and-drop library
   */
  const onDragEnd = (result: DropResult) => {
    if (!board) return;

    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "TASK") {
      const sourceCol = board.columns.find(
        (col: ColumnType) => col.id === source.droppableId
      );
      const destCol = board.columns.find(
        (col: ColumnType) => col.id === destination.droppableId
      );

      if (!sourceCol || !destCol) return;

      const taskToMove = sourceCol.tasks[source.index];

      if (source.droppableId === destination.droppableId) {
        // Reorder task within same column
        const newTasks = [...sourceCol.tasks];
        newTasks.splice(source.index, 1);
        newTasks.splice(destination.index, 0, taskToMove);

        updateBoard({
          ...board,
          columns: board.columns.map((col: ColumnType) =>
            col.id === sourceCol.id ? { ...col, tasks: newTasks } : col
          ),
        });
      } else {
        // Move task between columns
        const sourceTasks = [...sourceCol.tasks];
        const destTasks = [...destCol.tasks];

        sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, taskToMove);

        updateBoard({
          ...board,
          columns: board.columns.map((col: ColumnType) =>
            col.id === sourceCol.id
              ? { ...col, tasks: sourceTasks }
              : col.id === destCol.id
              ? { ...col, tasks: destTasks }
              : col
          ),
        });
      }
    } else if (type === "COLUMN") {
      // Reorder columns
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
   * Add a new column to the board after validating title
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

  /**
   * Navigate back to dashboard
   */
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (status === "loading") {
    return <Loader text="Loading session..." />;
  }

  if (!session) {
    return <Loader text="Redirecting to sign in..." />;
  }

  if (!currentUser) {
    return <Loader text="Loading user..." />;
  }

  if (!board) {
    return <Loader text="Loading board..." />;
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-4 sm:p-6 bg-gray-900 min-h-screen">
          {/* Back to Dashboard Button */}
          <div className="mb-4">
            <button
              onClick={handleBackToDashboard}
              className="flex cursor-pointer items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Board Header */}
          <div className="mb-4 sm:mb-6 flex flex-col md:flex-row gap-4 md:items-center">
            <input
              type="text"
              value={localBoardTitle}
              onChange={(e) => setLocalBoardTitle(e.target.value)}
              className="text-2xl sm:text-3xl font-bold bg-transparent text-white border-b-2 border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Board Title"
            />
            <button
              onClick={() => setIsPopupOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-all duration-200 max-w-[160px] lg:w-auto"
            >
              Add Column
            </button>
          </div>

          {/* Board Columns */}
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
                        onTaskAdded={(
                          columnId: string,
                          title: string,
                          priority?: string,
                          userId?: string
                        ) => handleAddTask(columnId, title, priority, userId)}
                        onRemoveTask={handleRemoveTask}
                        onOpenTaskDetail={setSelectedTaskId}
                        onTaskUpdate={fetchBoardData}
                        currentUser={currentUser}
                        selectedTaskId={selectedTaskId}
                        onOpenAddTask={setAddTaskColumnId}
                        priorities={priorities}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add Column Popup */}
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

      {/* Single Task Detail View in Edit Mode */}
      <AnimatePresence>
        {selectedTaskId && !addTaskColumnId && (
          <SingleTaskView
            taskId={selectedTaskId}
            mode="edit"
            onClose={() => setSelectedTaskId(null)}
            onTaskUpdate={() => {
              fetchBoardData();
            }}
            currentUser={currentUser}
            priorities={priorities}
          />
        )}
      </AnimatePresence>

      {/* Single Task Detail View in Add Mode */}
      <AnimatePresence>
        {addTaskColumnId && !selectedTaskId && (
          <SingleTaskView
            mode="add"
            columnId={addTaskColumnId}
            boardId={id as string}
            onClose={() => setAddTaskColumnId(null)}
            onTaskAdd={(newTask) => {
              updateBoard({
                ...board,
                columns: board.columns.map((col: ColumnType) =>
                  col.id === addTaskColumnId
                    ? { ...col, tasks: [...col.tasks, newTask] }
                    : col
                ),
              });
              setAddTaskColumnId(null);
            }}
            onTaskAdded={handleAddTask}
            currentUser={currentUser}
            priorities={priorities}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Page;

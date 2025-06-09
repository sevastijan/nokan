"use client";

import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";
import { useParams, useRouter } from "next/navigation";
import { useBoard } from "../../hooks/useBoard";
import Column from "../../components/Column";
import AddColumnPopup from "../../components/TaskColumn/AddColumnPopup";
import SingleTaskView from "../../components/SingleTaskView/SingleTaskView";
import Calendar from "../../components/Calendar/Calendar";
import SearchAndFilters from "../../components/SearchAndFilters/SearchAndFilters";
import ViewToggle from "../../components/ViewToggle/ViewToggle";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import Button from "../../components/Button/Button";
import BoardViewToggle from "../../components/BoardViewToggle/BoardViewToggle";
import ListView from "../../components/ListView/ListView";
import { JSX, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import { Column as ColumnType } from "../../types/useBoardTypes";
import { User } from "../../components/SingleTaskView/types";
import { useSession } from "next-auth/react";
import Loader from "../../components/Loader";
import { supabase } from "../../lib/supabase";
import { extractIdFromUrl } from "../../lib/utils";
import { getPriorities, getTeams } from "../../lib/api";
import Task from "../../components/Task";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

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
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [priorities, setPriorities] = useState<
    Array<{ id: string; label: string; color: string }>
  >([]);
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns");

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
   * If there is ID in url, display task details
   */
  useEffect(() => {
    const id = extractIdFromUrl(window.location.href);
    if (id) {
      setSelectedTaskId(id);
    }
  }, []);

  /**
   * Log board data when columns are loaded
   */
  useEffect(() => {
    if (board?.columns) {
      console.log("Board data loaded:");
      board.columns.forEach((col) => {
        console.log(
          `Column ${col.title}:`,
          col.tasks.map((t) => ({ id: t.id, title: t.title, order: t.order }))
        );
      });
    }
  }, [board]);

  /**
   * Enhanced drag and drop handler
   * @param result - Result object from drag-and-drop library
   */
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination || !board) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "COLUMN") {
      const reorderedColumns = Array.from(board.columns);
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);

      const columnsWithNewOrder = reorderedColumns.map((column, index) => ({
        ...column,
        order: index,
      }));

      updateBoard({
        ...board,
        columns: columnsWithNewOrder,
      });

      await Promise.all(
        columnsWithNewOrder.map(async (column, index) => {
          if (column.order !== index) {
            try {
              const { error } = await supabase
                .from("columns")
                .update({ order: index })
                .eq("id", column.id);

              if (error) {
                console.error("Error updating column order:", error);
              }
            } catch (error) {
              console.error("Error updating column order:", error);
            }
          }
        })
      );

      return;
    }

    if (type === "TASK") {
      const sourceColumn = board.columns.find(
        (col) => col.id === source.droppableId
      );
      const destColumn = board.columns.find(
        (col) => col.id === destination.droppableId
      );

      if (!sourceColumn || !destColumn) return;

      if (source.droppableId === destination.droppableId) {
        const sortedTasks = [...sourceColumn.tasks].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );

        console.log(
          "Sorted tasks:",
          sortedTasks.map((t) => ({ id: t.id, order: t.order }))
        );

        const [movedTask] = sortedTasks.splice(source.index, 1);
        sortedTasks.splice(destination.index, 0, movedTask);

        const tasksWithNewOrder = sortedTasks.map((task, index) => ({
          ...task,
          order: index,
        }));

        console.log(
          "Tasks with new order:",
          tasksWithNewOrder.map((t) => ({ id: t.id, order: t.order }))
        );

        const newColumns = board.columns.map((col) =>
          col.id === sourceColumn.id
            ? { ...col, tasks: tasksWithNewOrder }
            : col
        );

        updateBoard({
          ...board,
          columns: newColumns,
        });

        await Promise.all(
          tasksWithNewOrder.map(async (task, index) => {
            try {
              const { error } = await supabase
                .from("tasks")
                .update({ order: index })
                .eq("id", task.id);

              if (error) {
                console.error("Error updating task order:", error);
              }
            } catch (error) {
              console.error("Error updating task order:", error);
            }
          })
        );
      } else {
        const sourceTasks = [...sourceColumn.tasks].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );
        const destTasks = [...destColumn.tasks].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );

        const [movedTask] = sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, {
          ...movedTask,
          column_id: destination.droppableId,
        });

        const sourceTasksWithOrder = sourceTasks.map((task, index) => ({
          ...task,
          order: index,
        }));

        const destTasksWithOrder = destTasks.map((task, index) => ({
          ...task,
          order: index,
        }));

        const newColumns = board.columns.map((col) => {
          if (col.id === sourceColumn.id) {
            return { ...col, tasks: sourceTasksWithOrder };
          }
          if (col.id === destColumn.id) {
            return { ...col, tasks: destTasksWithOrder };
          }
          return col;
        });

        updateBoard({
          ...board,
          columns: newColumns,
        });

        try {
          await supabase
            .from("tasks")
            .update({
              column_id: destination.droppableId,
              order: destination.index,
            })
            .eq("id", movedTask.id);

          const allTasksToUpdate = [
            ...sourceTasksWithOrder.map((task, index) => ({
              ...task,
              order: index,
            })),
            ...destTasksWithOrder.map((task, index) => ({
              ...task,
              order: index,
            })),
          ];

          for (const task of allTasksToUpdate) {
            await supabase
              .from("tasks")
              .update({ order: task.order })
              .eq("id", task.id);
          }

          console.log("Task moved successfully");
        } catch (error) {
          console.error("Error updating task positions:", error);
          fetchBoardData();
        }
      }
    }
  };

  /**
   * Navigate back to dashboard
   */
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  /**
   * Handle calendar task click - open task in edit mode
   */
  const handleCalendarTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  /**
   * Add a new column to the board after validating title
   */
  const addColumn = async () => {
    if (newColumnTitle.trim()) {
      setIsAddingColumn(true);
      try {
        await handleAddColumn(newColumnTitle.trim());
        setNewColumnTitle("");
        setIsPopupOpen(false);
      } catch (error) {
        console.error("Error adding column:", error);
      } finally {
        setIsAddingColumn(false);
      }
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 shadow-lg sticky top-0 z-40">
              <div className="px-6 py-4 space-y-4">
                {/* Breadcrumbs */}
                <Breadcrumbs
                  items={[
                    {
                      label: "Dashboard",
                      href: "/dashboard",
                      icon: <FiHome className="w-4 h-4" />,
                    },
                    {
                      label: "Boards",
                      href: "/dashboard",
                    },
                    {
                      label: board?.title || "Loading...",
                    },
                  ]}
                />

                {/* Main Header Content */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBackToDashboard}
                      className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 group"
                    >
                      <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="font-medium">Back</span>
                    </button>
                    <div className="w-px h-6 bg-slate-600"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-sm"></div>
                      <input
                        type="text"
                        value={localBoardTitle}
                        onChange={(e) => setLocalBoardTitle(e.target.value)}
                        className="text-2xl font-bold bg-transparent text-white border-none focus:outline-none focus:ring-0 p-0 hover:bg-slate-700/30 rounded px-3 py-2 transition-all duration-200 min-w-[200px] placeholder-slate-400"
                        placeholder="Untitled Board"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <SearchAndFilters />
                    <BoardViewToggle
                      viewMode={viewMode}
                      onViewChange={setViewMode}
                    />
                    <ViewToggle
                      showCalendar={showCalendar}
                      setShowCalendar={setShowCalendar}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsPopupOpen(true)}
                      className="shadow-sm hover:shadow-md bg-indigo-600 hover:bg-indigo-700"
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      }
                    >
                      Add Column
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Board Container */}
          <div className="flex-1 p-6">
            {viewMode === "columns" ? (
              <Droppable
                droppableId="board"
                type="COLUMN"
                direction="horizontal"
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex gap-6 h-full"
                  >
                    {board?.columns?.map((column, index) => (
                      <Column
                        key={column.id}
                        column={column}
                        colIndex={index}
                        onUpdateColumnTitle={handleUpdateColumnTitle}
                        onRemoveColumn={handleRemoveColumn}
                        onTaskAdded={handleAddTask}
                        onRemoveTask={handleRemoveTask}
                        onOpenTaskDetail={setSelectedTaskId}
                        currentUser={currentUser}
                        selectedTaskId={selectedTaskId}
                        onOpenAddTask={setAddTaskColumnId}
                        priorities={priorities}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ) : (
              <ListView
                columns={board?.columns || []}
                onOpenTaskDetail={setSelectedTaskId}
                onRemoveTask={handleRemoveTask}
                priorities={priorities}
              />
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Modals */}
      <AddColumnPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onAddColumn={addColumn}
        newColumnTitle={newColumnTitle}
        setNewColumnTitle={setNewColumnTitle}
        isAddingColumn={isAddingColumn}
      />

      <AnimatePresence>
        {selectedTaskId && !addTaskColumnId && (
          <SingleTaskView
            taskId={selectedTaskId}
            mode="edit"
            boardId={id as string}
            onClose={() => setSelectedTaskId(null)}
            onTaskUpdate={() => {
              fetchBoardData();
            }}
            currentUser={currentUser}
            priorities={priorities}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addTaskColumnId && !selectedTaskId && (
          <SingleTaskView
            mode="add"
            columnId={addTaskColumnId}
            boardId={id as string}
            onClose={() => setAddTaskColumnId(null)}
            onTaskAdded={async (
              columnId: string,
              title: string,
              priority?: number,
              userId?: number
            ) => {
              const priorityNumber = priority || 2;
              const userIdNumber = userId || parseInt(currentUser?.id || "0");

              const newTask = await handleAddTask(
                columnId,
                title,
                priorityNumber.toString(),
                userIdNumber.toString()
              );

              updateBoard({
                ...board,
                columns: board.columns.map((col: ColumnType) =>
                  col.id === addTaskColumnId
                    ? {
                        ...col,
                        tasks: [
                          ...col.tasks,
                          {
                            ...newTask,
                            order: col.tasks.length,
                            column_id: addTaskColumnId,
                            board_id: board.id,
                            priority: priorityNumber.toString(),
                          },
                        ],
                      }
                    : col
                ),
              });
              setAddTaskColumnId(null);
              return newTask;
            }}
            currentUser={currentUser}
            priorities={priorities}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;

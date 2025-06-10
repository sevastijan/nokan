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
import {
  FaArrowLeft,
  FaColumns,
  FaList,
  FaCalendarAlt,
  FaPlus,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    assignee: "",
    priority: "",
    dueDate: "",
  });

  /**
   * Handle board title blur event
   */
  const handleBoardTitleBlur = () => {
    if (localBoardTitle !== board?.title) {
      handleUpdateBoardTitle(localBoardTitle);
    }
  };

  /**
   * Handle board title key down event
   */
  const handleBoardTitleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

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

  /**
   * Filter tasks based on search query and filters
   */
  const filterTasks = (tasks: any[], searchQuery: string, filters: any) => {
    return tasks.filter((task) => {
      // Search by title and description
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by assignee
      const matchesAssignee =
        !filters.assignee ||
        (filters.assignee === "me" && task.assignee?.id === currentUser?.id) ||
        (filters.assignee === "unassigned" && !task.assignee) ||
        task.assignee?.name
          ?.toLowerCase()
          .includes(filters.assignee.toLowerCase());

      // Filter by priority
      const matchesPriority =
        !filters.priority || task.priority === filters.priority;

      // Filter by due date
      const matchesDueDate =
        !filters.dueDate ||
        (() => {
          if (!task.due_date) return filters.dueDate === "";

          const dueDate = new Date(task.due_date);
          const today = new Date();
          const weekFromNow = new Date(
            today.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          const monthFromNow = new Date(
            today.getTime() + 30 * 24 * 60 * 60 * 1000
          );

          switch (filters.dueDate) {
            case "overdue":
              return dueDate < today;
            case "today":
              return dueDate.toDateString() === today.toDateString();
            case "week":
              return dueDate <= weekFromNow;
            case "month":
              return dueDate <= monthFromNow;
            default:
              return true;
          }
        })();

      return (
        matchesSearch && matchesAssignee && matchesPriority && matchesDueDate
      );
    });
  };

  /**
   * Filter board data before rendering
   */
  const filteredBoard = board
    ? {
        ...board,
        columns: board.columns.map((column) => ({
          ...column,
          tasks: filterTasks(column.tasks, searchQuery, filters),
        })),
      }
    : null;

  /**
   * Handle task addition - extracted from inline function
   */
  const handleTaskAdded = async (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => {
    console.log("=== DEBUG handleTaskAdded ===");
    console.log("handleTaskAdded called with:", {
      columnId,
      title,
      priority,
      userId,
    });
    console.log("userId type:", typeof userId);
    console.log("userId is null/undefined:", userId == null);

    try {
      const priorityId = priority || "medium";
      const assigneeId = userId;

      console.log("Processed values:", {
        priorityId,
        assigneeId,
      });

      const newTask = await handleAddTask(
        columnId,
        title,
        priorityId,
        assigneeId
      );

      console.log("New task created:", newTask);

      if (newTask && board) {
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
                      priority: priorityId,
                    },
                  ],
                }
              : col
          ),
        });
      }

      setAddTaskColumnId(null);
      return newTask;
    } catch (error) {
      console.error("Error adding task:", error);
      setAddTaskColumnId(null);
      throw error;
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
          {/* Header with board title and controls */}
          <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 shadow-lg sticky top-0 z-40">
            <div className="px-6 py-5 space-y-4">
              {/* First row - Breadcrumbs and board title */}
              <div className="flex items-center justify-between">
                {/* Left side - Breadcrumbs and board title */}
                <div className="flex items-center gap-6">
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      <FaArrowLeft className="w-4 h-4" />
                      <span className="font-medium">Back</span>
                    </button>

                    <span className="text-slate-500">/</span>

                    <span className="text-slate-300 font-medium">Boards</span>

                    <span className="text-slate-500">/</span>

                    <span className="text-white font-medium truncate max-w-[200px]">
                      {board?.title || "Board"}
                    </span>
                  </div>

                  <div className="w-px h-6 bg-slate-600"></div>

                  {/* Board title with status indicator */}
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <input
                      type="text"
                      value={localBoardTitle}
                      onChange={(e) => setLocalBoardTitle(e.target.value)}
                      onBlur={handleBoardTitleBlur}
                      onKeyDown={handleBoardTitleKeyDown}
                      className="bg-transparent text-2xl font-bold text-white border-none outline-none focus:bg-slate-800/50 rounded-lg px-3 py-2 transition-colors min-w-[300px]"
                      placeholder="Board Title"
                    />
                  </div>
                </div>

                {/* Right side - Task Stats */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-400">
                    <span className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/30">
                      Total:{" "}
                      {board?.columns?.reduce(
                        (total, col) => total + col.tasks.length,
                        0
                      ) || 0}{" "}
                      tasks
                    </span>
                  </div>
                </div>
              </div>

              {/* Second row - Search and controls */}
              <div className="flex items-center justify-between">
                {/* Left side - Search and Filter */}
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
                    />
                  </div>

                  {/* Filter Button */}
                  <Button variant="ghost" size="sm" icon={<FaFilter />}>
                    Filter
                  </Button>
                </div>

                {/* Right side - View Toggle and Action Buttons */}
                <div className="flex items-center gap-4">
                  {/* View Toggle */}
                  <div className="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/30">
                    <button
                      onClick={() => setViewMode("columns")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === "columns"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                      }`}
                    >
                      <FaColumns className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                      }`}
                    >
                      <FaList className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-slate-600"></div>

                  {/* Action Buttons */}
                  <Button
                    variant={showCalendar ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      console.log(
                        "Calendar button clicked, current state:",
                        showCalendar
                      );
                      setShowCalendar(!showCalendar);
                    }}
                    icon={<FaCalendarAlt />}
                    className={
                      showCalendar ? "bg-blue-600 hover:bg-blue-700" : ""
                    }
                  >
                    {showCalendar ? "Close Calendar" : "Calendar"}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPopupOpen(true)}
                    icon={<FaPlus />}
                  >
                    Add Column
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Board Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-6">
              {/* Calendar View */}
              {showCalendar ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Calendar View
                      </h2>
                      <p className="text-slate-400 mt-1">
                        Drag tasks to change their dates • Click tasks to view
                        details
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* View mode buttons */}
                      <div className="flex items-center bg-slate-700/50 rounded-xl p-1 border border-slate-600/30">
                        <button
                          onClick={() => {
                            setShowCalendar(false);
                            setViewMode("columns");
                          }}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-300 hover:text-white hover:bg-slate-600/50 flex items-center gap-2"
                        >
                          <FaColumns className="w-4 h-4" />
                          <span>Columns</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowCalendar(false);
                            setViewMode("list");
                          }}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all text-slate-300 hover:text-white hover:bg-slate-600/50 flex items-center gap-2"
                        >
                          <FaList className="w-4 h-4" />
                          <span>List</span>
                        </button>
                      </div>

                      {/* Close button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log("Close calendar button clicked");
                          setShowCalendar(false);
                        }}
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                      >
                        <FaTimes className="w-4 h-4 mr-2" />
                        Close
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    boardId={id as string}
                    onTaskClick={handleCalendarTaskClick}
                  />
                </motion.div>
              ) : viewMode === "columns" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Droppable
                    droppableId="board"
                    type="COLUMN"
                    direction="horizontal"
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex gap-6 h-full overflow-x-auto pb-4"
                      >
                        {filteredBoard?.columns?.map((column, index) => (
                          <Column
                            key={column.id}
                            column={column}
                            colIndex={index}
                            onUpdateColumnTitle={handleUpdateColumnTitle}
                            onRemoveColumn={handleRemoveColumn}
                            onTaskAdded={handleTaskAdded} // Now just pass the function reference
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
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ListView
                    columns={filteredBoard?.columns || []}
                    onOpenTaskDetail={setSelectedTaskId}
                    onRemoveTask={handleRemoveTask}
                    priorities={priorities}
                  />
                </motion.div>
              )}
            </div>
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
            onTaskAdded={handleTaskAdded} // Same function reference
            currentUser={currentUser}
            priorities={priorities}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;

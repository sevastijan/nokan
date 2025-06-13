// src/app/(protected)/board/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useBoard } from "@/app/hooks/useBoard"; // adjust path
import Column from "@/app/components/Column";
import AddColumnPopup from "@/app/components/TaskColumn/AddColumnPopup";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
import Calendar from "@/app/components/Calendar/Calendar";
import Button from "@/app/components/Button/Button";
import ListView from "@/app/components/ListView/ListView";
import {
  FaArrowLeft,
  FaColumns,
  FaList,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import Loader from "@/app/components/Loader";
import { supabase } from "@/app/lib/supabase";
import { extractTaskIdFromUrl } from "@/app/utils/helpers";
import { getPriorities } from "@/app/lib/api";
import {
  Column as ColumnType,
  Task as TaskType,
  User,
  Priority,
} from "@/app/types/globalTypes";
import { toast } from "react-toastify";

const Page = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const {
    board,
    loading: boardLoading,
    error: boardError,
    fetchBoardData,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleRemoveTask,
    handleAddTask,
  } = useBoard(id as string);

  const [localBoardTitle, setLocalBoardTitle] = useState(board?.title || "");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [priorities, setPriorities] = useState<
    Array<{ id: string; label: string; color: string }>
  >([]);
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns");

  // Local state for columns ordering
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);

  // Sync columns when board.columns changes
  useEffect(() => {
    if (board?.columns) {
      // sort by order property
      const sorted = [...board.columns].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      setLocalColumns(sorted);
    }
  }, [board?.columns]);

  // Board title editing handlers
  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title]);

  const handleBoardTitleBlur = () => {
    if (localBoardTitle.trim() !== board?.title) {
      handleUpdateBoardTitle(localBoardTitle.trim());
    }
  };
  const handleBoardTitleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Load priorities once
  useEffect(() => {
    const loadPriorities = async () => {
      try {
        const fetchedPriorities = await getPriorities();
        setPriorities(fetchedPriorities);
      } catch {
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

  // Fetch or create current user from session
  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.email) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (userData && !error) {
          setCurrentUser({
            id: userData.id,
            name: userData.name || session.user.name || "Unknown User",
            email: userData.email,
            image: userData.image || session.user.image,
            created_at: userData.created_at,
          });
        } else if (error?.code === "PGRST116") {
          const { data: newUser } = await supabase
            .from("users")
            .insert({
              email: session.user.email,
              name: session.user.name || "Unknown User",
              image: session.user.image || null,
            })
            .select()
            .single();
          setCurrentUser({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            image: newUser.image,
            created_at: newUser.created_at,
          });
        } else {
          setCurrentUser({
            id: session.user.email || "temp-id",
            name: session.user.name || "Unknown User",
            email: session.user.email || "",
            image: session.user.image ?? undefined,
          });
        }
      }
    };
    if (session?.user?.email) fetchUser();
  }, [session]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // If URL has ?task=<id>, open that task
  useEffect(() => {
    if (typeof window !== "undefined") {
      const idFromUrl = extractTaskIdFromUrl(window.location.href);
      if (idFromUrl) setSelectedTaskId(idFromUrl);
    }
  }, []);

  // Add Column
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const addColumn = async () => {
    if (newColumnTitle.trim()) {
      setIsAddingColumn(true);
      try {
        await handleAddColumn(newColumnTitle.trim());
        setNewColumnTitle("");
        setIsPopupOpen(false);
        await fetchBoardData();
      } catch {
        // logged inside useBoard
      } finally {
        setIsAddingColumn(false);
      }
    }
  };

  // Open Add Task in Column
  const handleOpenAddTask = useCallback((columnId: string) => {
    setAddTaskColumnId(columnId);
  }, []);

  const handleTaskAdded = async (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => {
    try {
      const newTask = await handleAddTask(columnId, title, priority, userId);
      await fetchBoardData();
      setAddTaskColumnId(null);
      return newTask;
    } catch {
      setAddTaskColumnId(null);
      throw new Error("Failed to add task");
    }
  };

  const onRemoveTaskLocal = async (columnId: string, taskId: string) => {
    try {
      await handleRemoveTask(columnId, taskId);
      await fetchBoardData();
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task. Please try again.");
    }
  };

  if (
    status === "loading" ||
    !session ||
    !currentUser ||
    boardLoading ||
    !board
  ) {
    return <Loader text="Loading..." />;
  }
  if (boardError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error loading board</div>
          <div className="text-slate-400 mb-6">{String(boardError)}</div>
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard")}
            icon={<FaArrowLeft />}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  /**
   * Handle reorder of columns (horizontal).
   * Framer Motion passes new ordered array of ColumnType.
   * We update localColumns immediately, then sync sort_order in DB, then refetch.
   */
  const handleReorderColumns = async (newOrder: ColumnType[]) => {
    setLocalColumns(newOrder);
    // Update sort_order in Supabase for each column
    try {
      await Promise.all(
        newOrder.map(async (col, idx) => {
          await supabase
            .from("columns")
            .update({ sort_order: idx })
            .eq("id", col.id);
        })
      );
      await fetchBoardData();
    } catch (error) {
      console.error("Error updating column order:", error);
      toast.error("Failed to save column order");
      // Optionally: refetch to restore UI
      fetchBoardData();
    }
  };

  /**
   * Handle reorder of tasks within a column.
   * Called by Column via prop onReorderTasks.
   */
  const handleReorderTasks = async (
    columnId: string,
    newTasksOrder: TaskType[]
  ) => {
    // newTasksOrder is sorted array of TaskType in new order
    // Update sort_order in DB for each
    try {
      await Promise.all(
        newTasksOrder.map(async (task, idx) => {
          await supabase
            .from("tasks")
            .update({ sort_order: idx })
            .eq("id", task.id);
        })
      );
      await fetchBoardData();
    } catch (error) {
      console.error("Error updating task order:", error);
      toast.error("Failed to save task order");
      fetchBoardData();
    }
  };

  // Calendar click handler
  const handleCalendarTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back</span>
                </button>
                <div className="w-px h-6 bg-slate-600"></div>
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
              <div className="text-sm text-slate-400">
                <span className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/30">
                  Total:{" "}
                  {board.columns.reduce(
                    (total, col) => total + col.tasks.length,
                    0
                  )}{" "}
                  tasks
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
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
                <Button
                  variant={showCalendar ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setShowCalendar(!showCalendar)}
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

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCalendar(false)}
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
                {/* Reorder.Group for columns, axis="x" for horizontal */}
                <Reorder.Group
                  axis="x"
                  values={localColumns}
                  onReorder={handleReorderColumns}
                  className="flex gap-6 h-full overflow-x-auto pb-4"
                >
                  <AnimatePresence initial={false}>
                    {localColumns.map((column, index) => (
                      <Reorder.Item
                        key={column.id}
                        value={column}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <Column
                          column={column}
                          colIndex={index}
                          onUpdateColumnTitle={handleUpdateColumnTitle}
                          onRemoveColumn={handleRemoveColumn}
                          onTaskAdded={handleTaskAdded}
                          selectedTaskId={selectedTaskId}
                          onRemoveTask={onRemoveTaskLocal}
                          onOpenTaskDetail={setSelectedTaskId}
                          onOpenAddTask={handleOpenAddTask}
                          currentUser={currentUser}
                          priorities={priorities}
                          onReorderTasks={handleReorderTasks}
                        />
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ListView
                  columns={board.columns}
                  onOpenTaskDetail={setSelectedTaskId}
                  onRemoveTask={handleRemoveTask}
                  priorities={priorities}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AddColumnPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onAddColumn={addColumn}
        newColumnTitle={newColumnTitle}
        setNewColumnTitle={setNewColumnTitle}
        isAddingColumn={isAddingColumn}
      />

      {(selectedTaskId || addTaskColumnId) && currentUser && !boardLoading && (
        <SingleTaskView
          key={
            selectedTaskId
              ? `edit-${selectedTaskId}`
              : addTaskColumnId
              ? `add-${addTaskColumnId}`
              : "fallback"
          }
          taskId={selectedTaskId ?? undefined}
          mode={selectedTaskId ? "edit" : "add"}
          boardId={id as string}
          columnId={addTaskColumnId ?? undefined}
          onClose={() => {
            setSelectedTaskId(null);
            setAddTaskColumnId(null);
          }}
          onTaskUpdate={fetchBoardData}
          onTaskAdded={() => {
            fetchBoardData();
            setAddTaskColumnId(null);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Page;

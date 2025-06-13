// src/app/(protected)/board/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";
import { useParams, useRouter } from "next/navigation";
import { useBoard } from "@/app/hooks/useBoard"; // adjust path
import Column from "@/app/components/Column";
import AddColumnPopup from "@/app/components/TaskColumn/AddColumnPopup";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
import Calendar from "@/app/components/Calendar/Calendar";
import Button from "@/app/components/Button/Button";
import ListView from "@/app/components/ListView/ListView";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
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

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [localBoardTitle, setLocalBoardTitle] = useState(board?.title || "");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [priorities, setPriorities] = useState<
    Array<{ id: string; label: string; color: string }>
  >([]);
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns");

  // Board title editing
  const handleBoardTitleBlur = () => {
    if (localBoardTitle !== board?.title) {
      handleUpdateBoardTitle(localBoardTitle);
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
            image: session.user.image,
          });
        }
      }
    };
    if (session?.user?.email) fetchUser();
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Sync localBoardTitle when board data arrives
  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title]);

  // Debounced auto-save on board title
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localBoardTitle !== board?.title) {
        handleUpdateBoardTitle(localBoardTitle);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [localBoardTitle, board?.title, handleUpdateBoardTitle]);

  // If URL has ?task=<id>, open that task
  useEffect(() => {
    const idFromUrl = extractTaskIdFromUrl(window.location.href);
    if (idFromUrl) setSelectedTaskId(idFromUrl);
  }, []);

  /**
   * onDragEnd: handle reordering columns or tasks.
   * For columns: update sort_order in DB.
   * For tasks: update sort_order or column_id accordingly.
   */
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination || !board) return;

    // no-op if location unchanged
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Reorder columns
    if (type === "COLUMN") {
      const reorderedColumns = Array.from(board.columns);
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);

      // assign new `order` values in JS for UI
      const columnsWithNewOrder = reorderedColumns.map((column, index) => ({
        ...column,
        order: index,
      }));
      // Update UI state
      // If you used a context or setter: updateBoard({ ...board, columns: columnsWithNewOrder });
      // But since we rely on RTK Query refetch after mutation, we can simply perform DB updates then refetch.
      // For immediate UI feedback you might optimistically update local state here if you manage board in React state.

      // Update each column in DB: rename order → sort_order
      await Promise.all(
        columnsWithNewOrder.map(async (column) => {
          await supabase
            .from("columns")
            .update({ sort_order: column.order })
            .eq("id", column.id);
        })
      );
      // Refetch board
      fetchBoardData();
      return;
    }

    // Reorder tasks
    if (type === "TASK") {
      const sourceColumn = board.columns.find(
        (col) => col.id === source.droppableId
      );
      const destColumn = board.columns.find(
        (col) => col.id === destination.droppableId
      );
      if (!sourceColumn || !destColumn) return;

      // Moving within same column
      if (source.droppableId === destination.droppableId) {
        const sortedTasks = [...sourceColumn.tasks].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const [movedTask] = sortedTasks.splice(source.index, 1);
        sortedTasks.splice(destination.index, 0, movedTask);

        // Assign new order in JS
        const tasksWithNewOrder = sortedTasks.map((task, index) => ({
          ...task,
          order: index,
        }));
        // Update each in DB: rename order → sort_order
        await Promise.all(
          tasksWithNewOrder.map(async (task) => {
            await supabase
              .from("tasks")
              .update({ sort_order: task.order })
              .eq("id", task.id);
          })
        );
        fetchBoardData();
      } else {
        // Moving between columns
        const sourceTasks = [...sourceColumn.tasks].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const destTasks = [...destColumn.tasks].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );

        const [movedTask] = sourceTasks.splice(source.index, 1);
        // Insert into dest at destination.index
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

        // Update movedTask column_id and sort_order
        await supabase
          .from("tasks")
          .update({
            column_id: destination.droppableId,
            sort_order: destination.index,
          })
          .eq("id", movedTask.id);

        // Update all others' sort_order
        await Promise.all(
          [
            ...sourceTasksWithOrder.map((t) => ({ id: t.id, order: t.order })),
            ...destTasksWithOrder.map((t) => ({ id: t.id, order: t.order })),
          ].map(async ({ id: tId, order }) => {
            await supabase
              .from("tasks")
              .update({ sort_order: order })
              .eq("id", tId);
          })
        );

        fetchBoardData();
      }
    }
  };

  // When calendar view is open and user clicks a task:
  const handleCalendarTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const addColumn = async () => {
    if (newColumnTitle.trim()) {
      setIsAddingColumn(true);
      try {
        await handleAddColumn(newColumnTitle.trim());
        setNewColumnTitle("");
        setIsPopupOpen(false);
      } catch {
        // logged inside useBoard
      } finally {
        setIsAddingColumn(false);
      }
    }
  };

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
      const newTask = await handleAddTask(
        columnId,
        title,
        priority || "medium",
        userId
      );
      // After adding, refetch board and reset popup
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <DragDropContext onDragEnd={onDragEnd}>
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
                    {board?.columns?.reduce(
                      (total, col) => total + col.tasks.length,
                      0
                    ) || 0}{" "}
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
                        {board.columns.map((column, index) => (
                          <Column
                            key={column.id}
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
      </DragDropContext>

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

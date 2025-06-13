// src/app/(protected)/board/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { toast } from "react-toastify";

import { supabase } from "@/app/lib/supabase";
import { extractTaskIdFromUrl } from "@/app/utils/helpers";
import { getPriorities } from "@/app/lib/api";

import Loader from "@/app/components/Loader";
import Button from "@/app/components/Button/Button";
import Column from "@/app/components/Column";
import AddColumnPopup from "@/app/components/TaskColumn/AddColumnPopup";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
import Calendar from "@/app/components/Calendar/Calendar";
import ListView from "@/app/components/ListView/ListView";

import {
  FaArrowLeft,
  FaColumns,
  FaList,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

import {
  Column as ColumnType,
  Task as TaskType,
  User,
} from "@/app/types/globalTypes";
import { useBoard } from "@/app/hooks/useBoard";

/**
 * Move an element in array from index `from` to index `to`.
 */
function reorderArray<T>(list: T[], from: number, to: number): T[] {
  const copy = Array.from(list);
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved!);
  return copy;
}

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
    handleUpdateTask,
    handleReorderTasks,
  } = useBoard(id as string);

  // UI state
  const [localBoardTitle, setLocalBoardTitle] = useState(board?.title || "");
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);
  const [isColumnPopupOpen, setIsColumnPopupOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [priorities, setPriorities] = useState<
    Array<{ id: string; label: string; color: string }>
  >([]);
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns");

  // Sync localColumns whenever board.columns changes
  useEffect(() => {
    if (!board?.columns) {
      setLocalColumns([]);
      return;
    }
    const sorted = [...board.columns]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((col) => ({
        ...col,
        tasks: Array.isArray(col.tasks) ? [...col.tasks] : [],
      }));
    setLocalColumns(sorted);
  }, [board?.columns]);

  // Sync board title locally
  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title]);

  // Load priorities once
  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await getPriorities();
        setPriorities(fetched);
      } catch {
        setPriorities([
          { id: "low", label: "Low", color: "#10b981" },
          { id: "medium", label: "Medium", color: "#f59e0b" },
          { id: "high", label: "High", color: "#ef4444" },
          { id: "urgent", label: "Urgent", color: "#dc2626" },
        ]);
      }
    };
    load();
  }, []);

  // Fetch or create current user record in Supabase
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
    if (session?.user?.email) {
      fetchUser();
    }
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Open task detail if URL has ?task=
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tid = extractTaskIdFromUrl(window.location.href);
      if (tid) {
        setSelectedTaskId(tid);
      }
    }
  }, []);

  // Board title handlers
  const handleBoardTitleBlur = () => {
    const trimmed = localBoardTitle.trim();
    if (trimmed && trimmed !== board?.title) {
      handleUpdateBoardTitle(trimmed);
    }
  };
  const handleBoardTitleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Add a new column
  const addColumn = async () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    setIsAddingColumn(true);
    try {
      await handleAddColumn(title);
      setNewColumnTitle("");
      setIsColumnPopupOpen(false);
      await fetchBoardData();
    } catch (e) {
      console.error("Failed to add column", e);
      toast.error("Failed to add column");
    } finally {
      setIsAddingColumn(false);
    }
  };

  // Open Add Task form
  const handleOpenAddTask = useCallback((columnId: string) => {
    setAddTaskColumnId(columnId);
  }, []);

  // After a task is added
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
    } catch (e) {
      console.error("Failed to add task", e);
      setAddTaskColumnId(null);
      throw e;
    }
  };

  // Remove a task
  const onRemoveTaskLocal = async (columnId: string, taskId: string) => {
    try {
      await handleRemoveTask(columnId, taskId);
      await fetchBoardData();
      toast.success("Task deleted");
    } catch (e) {
      console.error("Failed to delete task", e);
      toast.error("Failed to delete task");
    }
  };

  // Drag end handler
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      console.log("DragEnd event:", result);
      const { source, destination, type } = result;
      if (!destination) return;

      // COLUMN reordering
      if (type === "COLUMN") {
        const fromIdx = source.index;
        const toIdx = destination.index;
        if (fromIdx === toIdx) return;

        // Optimistically reorder localColumns
        const newCols = reorderArray(localColumns, fromIdx, toIdx);
        setLocalColumns(newCols);

        // Persist new column order
        try {
          await Promise.all(
            newCols.map(async (col, idx) => {
              const { error } = await supabase
                .from("columns")
                .update({ order: idx })
                .eq("id", col.id);
              if (error) throw error;
            })
          );
          await fetchBoardData();
        } catch (e) {
          console.error("Failed to reorder columns", e);
          toast.error("Failed to reorder columns");
          await fetchBoardData();
        }
        return;
      }

      // TASK reordering / moving
      if (type === "TASK") {
        console.log(
          `Task drag from ${source.droppableId}[${source.index}] to ${destination.droppableId}[${destination.index}]`
        );
        const srcColId = source.droppableId;
        const dstColId = destination.droppableId;
        const fromIdx = source.index;
        const toIdx = destination.index;

        const srcColIndex = localColumns.findIndex((c) => c.id === srcColId);
        const dstColIndex = localColumns.findIndex((c) => c.id === dstColId);
        if (srcColIndex < 0 || dstColIndex < 0) {
          console.warn(
            "Unknown droppableId in handleDragEnd:",
            srcColId,
            dstColId
          );
          return;
        }

        // Intra-column reorder
        if (srcColId === dstColId) {
          const tasks = Array.from(localColumns[srcColIndex].tasks || []);
          const newTasksOrder = reorderArray(tasks, fromIdx, toIdx);
          const updatedCols = Array.from(localColumns);
          updatedCols[srcColIndex] = {
            ...updatedCols[srcColIndex],
            tasks: newTasksOrder,
          };
          setLocalColumns(updatedCols);

          // Persist sort_order updates
          try {
            console.log(
              "Reordering tasks in column",
              srcColId,
              "new order IDs:",
              newTasksOrder.map((t) => t.id)
            );
            await handleReorderTasks(srcColId, newTasksOrder);
            await fetchBoardData();
          } catch (e) {
            console.error("Failed to reorder tasks", e);
            toast.error("Failed to reorder tasks");
            await fetchBoardData();
          }
          return;
        }

        // Inter-column move
        const srcTasks = Array.from(localColumns[srcColIndex].tasks || []);
        const dstTasks = Array.from(localColumns[dstColIndex].tasks || []);
        const [movedTask] = srcTasks.splice(fromIdx, 1);
        if (!movedTask) return;
        dstTasks.splice(toIdx, 0, movedTask);

        const updatedCols = Array.from(localColumns);
        updatedCols[srcColIndex] = {
          ...updatedCols[srcColIndex],
          tasks: srcTasks,
        };
        updatedCols[dstColIndex] = {
          ...updatedCols[dstColIndex],
          tasks: dstTasks,
        };
        setLocalColumns(updatedCols);

        // Persist: update moved task's column_id and order, then reorder both columns
        try {
          console.log(
            "Moving task",
            movedTask.id,
            "to column",
            dstColId,
            "at index",
            toIdx
          );
          // 1) Update moved task's column_id + its new order
          await handleUpdateTask(movedTask.id, {
            column_id: dstColId,
            order: dstTasks.findIndex((t) => t.id === movedTask.id),
          });
          // 2) Reorder remaining tasks in source column
          await handleReorderTasks(srcColId, srcTasks);
          // 3) Reorder tasks in destination column
          await handleReorderTasks(dstColId, dstTasks);
          await fetchBoardData();
        } catch (e) {
          console.error("Failed to move task between columns", e);
          toast.error("Failed to move task");
          await fetchBoardData();
        }
      }
    },
    [localColumns, handleReorderTasks, handleUpdateTask, fetchBoardData]
  );

  // Early returns
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
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
              <div className="w-px h-6 bg-slate-600" />
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
                {board.columns.reduce((sum, col) => sum + col.tasks.length, 0)}{" "}
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
                className={showCalendar ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {showCalendar ? "Close Calendar" : "Calendar"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsColumnPopupOpen(true)}
                icon={<FaPlus />}
              >
                Add Column
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 flex flex-col h-full">
          {showCalendar ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Calendar View
                  </h2>
                  <p className="text-slate-400 mt-1">
                    Drag tasks to change dates • Click to view details
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCalendar(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                    icon={<FaTimes className="w-4 h-4 mr-2" />}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <Calendar
                boardId={id as string}
                onTaskClick={(tid) => setSelectedTaskId(tid)}
              />
            </>
          ) : viewMode === "columns" ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable
                droppableId="all-columns"
                direction="horizontal"
                type="COLUMN"
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex items-stretch gap-6 overflow-x-auto pb-4"
                  >
                    {localColumns.map((column, idx) => (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={idx}
                      >
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={{ ...prov.draggableProps.style }}
                            className="flex-shrink-0 h-full"
                          >
                            <Column
                              column={column}
                              colIndex={idx}
                              onUpdateColumnTitle={handleUpdateColumnTitle}
                              onRemoveColumn={handleRemoveColumn}
                              onTaskAdded={handleTaskAdded}
                              selectedTaskId={selectedTaskId}
                              onRemoveTask={onRemoveTaskLocal}
                              onOpenTaskDetail={setSelectedTaskId}
                              onOpenAddTask={handleOpenAddTask}
                              currentUser={currentUser!}
                              priorities={priorities}
                              onReorderTasks={handleReorderTasks}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <ListView
              columns={board.columns}
              onOpenTaskDetail={setSelectedTaskId}
              onRemoveTask={handleRemoveTask}
              priorities={priorities}
            />
          )}
        </div>
      </div>

      {/* Add Column Popup */}
      <AddColumnPopup
        isOpen={isColumnPopupOpen}
        onClose={() => setIsColumnPopupOpen(false)}
        onAddColumn={addColumn}
        newColumnTitle={newColumnTitle}
        setNewColumnTitle={setNewColumnTitle}
        isAddingColumn={isAddingColumn}
      />

      {/* Task detail or add-task modal */}
      {(selectedTaskId || addTaskColumnId) && currentUser && (
        <SingleTaskView
          key={
            selectedTaskId
              ? `edit-${selectedTaskId}`
              : addTaskColumnId
              ? `add-${addTaskColumnId}`
              : "taskview"
          }
          taskId={selectedTaskId ?? undefined}
          mode={selectedTaskId ? "edit" : "add"}
          boardId={id as string}
          columnId={addTaskColumnId ?? undefined}
          onClose={() => {
            setSelectedTaskId(null);
            setAddTaskColumnId(null);
          }}
          onTaskUpdate={() => fetchBoardData()}
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

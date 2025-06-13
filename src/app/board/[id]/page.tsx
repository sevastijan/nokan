// src/app/(protected)/board/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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

  // Stan lokalny do optymistycznego UI
  const [localBoardTitle, setLocalBoardTitle] = useState(board?.title || "");
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
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

  // Synchronizacja localColumns po fetchu z backendu
  useEffect(() => {
    if (board?.columns) {
      const sorted = [...board.columns]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((col) => ({
          ...col,
          tasks: Array.isArray(col.tasks) ? [...col.tasks] : [],
        }));
      setLocalColumns(sorted);
    }
  }, [board?.columns]);

  // Synchronizacja tytułu
  useEffect(() => {
    if (board?.title && board.title !== localBoardTitle) {
      setLocalBoardTitle(board.title);
    }
  }, [board?.title]);

  const handleBoardTitleBlur = () => {
    if (localBoardTitle.trim() && localBoardTitle.trim() !== board?.title) {
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

  // Load priorities
  useEffect(() => {
    const loadPriorities = async () => {
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
    loadPriorities();
  }, []);

  // Fetch/create current user
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

  // Jeśli w URL jest task id
  useEffect(() => {
    if (typeof window !== "undefined") {
      const idFromUrl = extractTaskIdFromUrl(window.location.href);
      if (idFromUrl) setSelectedTaskId(idFromUrl);
    }
  }, []);

  // Dodawanie kolumny
  const addColumn = async () => {
    if (newColumnTitle.trim()) {
      setIsAddingColumn(true);
      try {
        await handleAddColumn(newColumnTitle.trim());
        setNewColumnTitle("");
        setIsPopupOpen(false);
        await fetchBoardData();
      } catch (e) {
        console.error("Błąd dodawania kolumny:", e);
      } finally {
        setIsAddingColumn(false);
      }
    }
  };

  // Otwórz AddTaskForm
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
    } catch (e) {
      setAddTaskColumnId(null);
      console.error("Błąd dodawania zadania:", e);
      throw e;
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

  // Spr. loading / error
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

  // Pomocnicza funkcja reorder
  const reorderArray = <T,>(
    list: T[],
    startIndex: number,
    endIndex: number
  ): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed!);
    return result;
  };

  // Obsługa DragEnd
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    // 1) Drag kolumny
    if (type === "COLUMN") {
      const fromIdx = source.index;
      const toIdx = destination.index;
      if (fromIdx === toIdx) return;

      // Optymistyczny reorder UI
      const newColsOrder = reorderArray(localColumns, fromIdx, toIdx);
      setLocalColumns(newColsOrder);

      // Backend: update `order` pola w tabeli columns
      try {
        await Promise.all(
          newColsOrder.map(async (col, idx) => {
            const { error } = await supabase
              .from("columns")
              .update({ order: idx })
              .eq("id", col.id);
            if (error) throw error;
          })
        );
        await fetchBoardData();
      } catch (e) {
        console.error("Błąd aktualizacji kolejności kolumn:", e);
        // rollback do fetchu
        await fetchBoardData();
      }
      return;
    }

    // 2) Drag zadań
    if (type === "TASK") {
      const srcColId = source.droppableId;
      const dstColId = destination.droppableId;
      const fromIdx = source.index;
      const toIdx = destination.index;

      const srcColIndex = localColumns.findIndex((c) => c.id === srcColId);
      const dstColIndex = localColumns.findIndex((c) => c.id === dstColId);
      if (srcColIndex < 0 || dstColIndex < 0) {
        console.warn("Nieznane droppableId w drag TASK:", srcColId, dstColId);
        return;
      }

      // Intra-column
      if (srcColId === dstColId) {
        const colIndex = srcColIndex;
        const currentTasks = Array.from(localColumns[colIndex].tasks || []);
        const newTasksOrder = reorderArray(currentTasks, fromIdx, toIdx);
        const newLocalCols = Array.from(localColumns);
        newLocalCols[colIndex] = {
          ...newLocalCols[colIndex],
          tasks: newTasksOrder,
        };
        setLocalColumns(newLocalCols);

        // Backend reorder zadań
        try {
          await handleReorderTasks(srcColId, newTasksOrder);
        } catch (e) {
          console.error("Błąd handleReorderTasks intra-column:", e);
          await fetchBoardData();
          return;
        }
        try {
          await fetchBoardData();
        } catch {}
        return;
      }

      // Inter-column
      const srcTasks = Array.from(localColumns[srcColIndex].tasks || []);
      const dstTasks = Array.from(localColumns[dstColIndex].tasks || []);
      const [movedTask] = srcTasks.splice(fromIdx, 1);
      if (!movedTask) {
        console.warn("Brak movedTask inter-column:", srcColId, fromIdx);
        return;
      }
      dstTasks.splice(toIdx, 0, movedTask);

      // Optymistyczny UI
      const updatedColumns = Array.from(localColumns);
      updatedColumns[srcColIndex] = {
        ...updatedColumns[srcColIndex],
        tasks: srcTasks,
      };
      updatedColumns[dstColIndex] = {
        ...updatedColumns[dstColIndex],
        tasks: dstTasks,
      };
      setLocalColumns(updatedColumns);

      // Backend: update przeniesionego zadania
      try {
        await handleUpdateTask(movedTask.id, {
          column_id: dstColId,
          order: toIdx,
        });
      } catch (e) {
        console.error("Błąd handleUpdateTask inter-column:", e);
        await fetchBoardData();
        return;
      }
      // reorder source
      try {
        await handleReorderTasks(srcColId, srcTasks);
      } catch (e) {
        console.error("Błąd handleReorderTasks source inter:", e);
        await fetchBoardData();
        return;
      }
      // reorder dest
      try {
        await handleReorderTasks(dstColId, dstTasks);
      } catch (e) {
        console.error("Błąd handleReorderTasks dest inter:", e);
        await fetchBoardData();
        return;
      }
      try {
        await fetchBoardData();
      } catch {}
      return;
    }
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
                  onTaskClick={(taskId: string) => setSelectedTaskId(taskId)}
                />
              </motion.div>
            ) : viewMode === "columns" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
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
                        className="flex gap-6 h-full overflow-x-auto pb-4"
                      >
                        <AnimatePresence initial={false}>
                          {localColumns.map((column, idx) => (
                            <Draggable
                              key={column.id}
                              draggableId={column.id}
                              index={idx}
                            >
                              {(prov, snapshot) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  style={{
                                    ...prov.draggableProps.style,
                                    // opcjonalnie cursor
                                    // cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                  }}
                                  className="flex-shrink-0"
                                >
                                  <Column
                                    column={column}
                                    colIndex={idx}
                                    onUpdateColumnTitle={
                                      handleUpdateColumnTitle
                                    }
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
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </AnimatePresence>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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

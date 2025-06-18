"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/lib/supabase";
import { useBoard } from "@/app/hooks/useBoard";
import Column from "@/app/components/Column";
import AddColumnPopup from "@/app/components/TaskColumn/AddColumnPopup";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
import ListView from "@/app/components/ListView/ListView";
import Loader from "@/app/components/Loader";
import { extractTaskIdFromUrl } from "@/app/utils/helpers";
import { getPriorities } from "@/app/lib/api";
import {
  Column as ColumnType,
  User,
  Priority,
  AssigneeOption,
  Task as TaskType,
} from "@/app/types/globalTypes";
import { FaArrowLeft } from "react-icons/fa";
import Button from "@/app/components/Button/Button";
import { toast } from "react-toastify";

import BoardHeader from "@/app/components/Board/BoardHeader";

const Page = () => {
  const { id } = useParams();
  const boardId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { data: session, status } = useSession();

  if (!boardId) {
    return <div>Missing boardId in URL!</div>;
  }

  // useBoard hook for data & actions
  const {
    board,
    loading: boardLoading,
    error: boardError,
    fetchBoardData,
    handleUpdateBoardTitle,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateColumnTitle,
    handleAddTask,
    handleRemoveTask,
  } = useBoard(boardId);

  // Local state
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);
  const [boardTitle, setBoardTitle] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [viewMode, setViewMode] = useState<"columns" | "list">("columns");

  // New: search + filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  // Sync localColumns when board updates
  useEffect(() => {
    if (!board) return;
    setBoardTitle(board.title);
    const sortedCols = board.columns
      .map((c) => ({
        ...c,
        tasks: (c.tasks || [])
          .map((t) => ({ ...t, order: t.sort_order ?? 0 }))
          .sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setLocalColumns(sortedCols);
  }, [board]);

  // Load priorities once
  useEffect(() => {
    getPriorities()
      .then(setPriorities)
      .catch(() =>
        setPriorities([
          { id: "low", label: "Low", color: "#10b981" },
          { id: "medium", label: "Medium", color: "#f59e0b" },
          { id: "high", label: "High", color: "#ef4444" },
          { id: "urgent", label: "Urgent", color: "#dc2626" },
        ])
      );
  }, []);

  // Ensure user record exists in Supabase
  useEffect(() => {
    if (!session?.user?.email) return;
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single();
      if (data && !error) {
        setCurrentUser({
          id: data.id,
          name: data.name!,
          email: data.email,
          image: data.image || undefined,
          created_at: data.created_at!,
        });
      } else {
        const { data: d2 } = await supabase
          .from("users")
          .insert({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          })
          .select()
          .single();
        setCurrentUser({
          id: d2.id,
          name: d2.name!,
          email: d2.email,
          image: d2.image || undefined,
          created_at: d2.created_at!,
        });
      }
    })();
  }, [session]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  // Read ?task= from URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = extractTaskIdFromUrl(window.location.href);
    if (t) setSelectedTaskId(t);
  }, []);

  // Board title edit
  const onBoardTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBoardTitle(e.target.value);
  };
  const onBoardTitleBlur = () => {
    const trimmed = boardTitle.trim();
    if (trimmed && trimmed !== board?.title) {
      handleUpdateBoardTitle(trimmed);
    }
  };

  // Add Column popup
  const openAddColumn = () => setIsPopupOpen(true);
  const closeAddColumn = () => setIsPopupOpen(false);
  const onAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    setIsAddingColumn(true);
    await handleAddColumn(newColumnTitle.trim());
    setNewColumnTitle("");
    closeAddColumn();
    await fetchBoardData();
    setIsAddingColumn(false);
  };

  // Add Task
  const openAddTask = (colId: string) => setAddTaskColumnId(colId);
  const onTaskAdded = async (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => {
    const t = await handleAddTask(columnId, title, priority, userId);
    // Update localColumns immediately
    setLocalColumns((cols) =>
      cols.map((c) =>
        c.id === columnId ? { ...c, tasks: [...(c.tasks || []), t] } : c
      )
    );
    setAddTaskColumnId(null);
    return t;
  };

  // Remove Task
  const onTaskRemoved = async (columnId: string, taskId: string) => {
    await handleRemoveTask(columnId, taskId);
    setLocalColumns((cols) =>
      cols.map((c) =>
        c.id === columnId
          ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
          : c
      )
    );
    toast.success("Task deleted");
  };

  // Drag & drop
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, type } = result;
      if (!destination) return;

      if (type === "COLUMN") {
        const cols = Array.from(localColumns);
        const [m] = cols.splice(source.index, 1);
        cols.splice(destination.index, 0, m);
        setLocalColumns(cols);
        // Persist
        await Promise.all(
          cols.map((c, i) =>
            supabase.from("columns").update({ order: i }).eq("id", c.id)
          )
        );
        await fetchBoardData();
        return;
      }

      if (type === "TASK") {
        const cols = Array.from(localColumns);
        const srcIdx = cols.findIndex((c) => c.id === source.droppableId);
        const dstIdx = cols.findIndex((c) => c.id === destination.droppableId);
        if (srcIdx < 0 || dstIdx < 0) return;

        const srcTasks = Array.from(cols[srcIdx].tasks || []);
        const [moved] = srcTasks.splice(source.index, 1);
        if (!moved) return;

        if (srcIdx === dstIdx) {
          srcTasks.splice(destination.index, 0, moved);
          const updated = srcTasks.map((t, i) => ({ ...t, order: i }));
          cols[srcIdx].tasks = updated;
          setLocalColumns(cols);
          // Persist sort_order
          await Promise.all(
            updated.map((t) =>
              supabase
                .from("tasks")
                .update({ sort_order: t.order })
                .eq("id", t.id)
            )
          );
        } else {
          const dstTasks = Array.from(cols[dstIdx].tasks || []);
          dstTasks.splice(destination.index, 0, moved);

          const updatedSrc = srcTasks.map((t, i) => ({ ...t, order: i }));
          const updatedDst = dstTasks.map((t, i) => ({ ...t, order: i }));

          cols[srcIdx].tasks = updatedSrc;
          cols[dstIdx].tasks = updatedDst;
          setLocalColumns(cols);

          // Persist both
          await Promise.all([
            ...updatedSrc.map((t) =>
              supabase
                .from("tasks")
                .update({ sort_order: t.order })
                .eq("id", t.id)
            ),
            ...updatedDst.map((t) =>
              supabase
                .from("tasks")
                .update({
                  sort_order: t.order,
                  column_id: destination.droppableId,
                })
                .eq("id", t.id)
            ),
          ]);
        }

        await fetchBoardData();
      }
    },
    [localColumns, fetchBoardData]
  );

  // Loading / error
  if (
    status === "loading" ||
    !session ||
    !currentUser ||
    boardLoading ||
    !board
  ) {
    return <Loader text="Loading board…" />;
  }
  if (boardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div>
          <h2 className="text-red-400 text-2xl mb-2">Error loading board</h2>
          <p className="mb-4">{String(boardError)}</p>
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

  // Compute totalTasks
  const totalTasks = board.columns.reduce(
    (sum, col) => sum + (col.tasks?.length || 0),
    0
  );

  // Extract unique assignees
  const assigneesList: AssigneeOption[] = [];
  board.columns.forEach((col) => {
    (col.tasks || []).forEach((task) => {
      if (task.assignee && task.assignee.id) {
        const assigneeId = task.assignee.id;
        if (!assigneesList.find((u) => u.id === assigneeId)) {
          assigneesList.push({
            id: assigneeId,
            name: task.assignee.name,
          });
        }
      }
    });
  });

  const selectedTaskColumnId = selectedTaskId
    ? localColumns.find((col) => col.tasks.some((t) => t.id === selectedTaskId))
        ?.id
    : null;

  // Filter columns/tasks
  const filteredColumns: ColumnType[] = localColumns.map((col) => {
    const filteredTasks = (col.tasks || []).filter((task) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const inTitle = task.title?.toLowerCase().includes(term);
        const inDesc = task.description?.toLowerCase().includes(term);
        if (!inTitle && !inDesc) return false;
      }
      // Priority filter
      if (filterPriority) {
        if (task.priority !== filterPriority) return false;
      }
      // Assignee filter
      if (filterAssignee) {
        if (!task.assignee || task.assignee.id !== filterAssignee) return false;
      }
      return true;
    });
    return { ...col, tasks: filteredTasks };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <BoardHeader
        boardTitle={boardTitle}
        onTitleChange={onBoardTitleChange}
        onTitleBlur={onBoardTitleBlur}
        onAddColumn={openAddColumn}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalTasks={totalTasks}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        priorities={priorities.map((p) => ({
          id: p.id,
          label: p.label,
          color: p.color,
        }))}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        assignees={assigneesList}
        filterAssignee={filterAssignee}
        onFilterAssigneeChange={setFilterAssignee}
      />

      {/* Body */}
      {viewMode === "columns" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="COLUMN"
          >
            {(provider) => (
              <div
                ref={provider.innerRef}
                {...provider.droppableProps}
                className="
                flex-1 flex
                overflow-x-auto
                snap-x snap-mandatory
                gap-4 md:gap-6
                p-2 md:p-6
                h-full
                scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent flex-col md:flex-row
              "
              >
                {filteredColumns.map((col, idx) => (
                  <Draggable key={col.id} draggableId={col.id} index={idx}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        style={prov.draggableProps.style}
                        className="
                        flex-shrink-0 flex h-full p-1
                        min-w-[88vw] sm:min-w-[340px] md:min-w-[320px] lg:min-w-[350px]
                        snap-start
                      "
                      >
                        {/* Column content */}
                        <div
                          className="
                          bg-white/10 dark:bg-gray-900/20
                          rounded-lg
                          border border-white/30 dark:border-gray-700/30
                          ring-1 ring-white/10 ring-offset-1 ring-offset-transparent
                          shadow-md
                          transition
                          flex flex-col
                          h-full
                          w-full
                          md:max-w-[350px]
                        "
                        >
                          {prov.dragHandleProps && (
                            <Column
                              column={col}
                              colIndex={idx}
                              onUpdateColumnTitle={handleUpdateColumnTitle}
                              onRemoveColumn={handleRemoveColumn}
                              onTaskAdded={onTaskAdded}
                              onRemoveTask={onTaskRemoved}
                              onOpenTaskDetail={setSelectedTaskId}
                              selectedTaskId={selectedTaskId}
                              currentUser={currentUser}
                              onOpenAddTask={openAddTask}
                              priorities={priorities}
                              dragHandleProps={prov.dragHandleProps}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provider.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // List view
        <div className="flex-1 overflow-auto p-6">
          <ListView
            columns={filteredColumns}
            onOpenTaskDetail={setSelectedTaskId}
            onRemoveTask={onTaskRemoved}
            priorities={priorities}
          />
        </div>
      )}

      {/* Add Column Popup */}
      <AddColumnPopup
        isOpen={isPopupOpen}
        onClose={closeAddColumn}
        onAddColumn={onAddColumn}
        newColumnTitle={newColumnTitle}
        setNewColumnTitle={setNewColumnTitle}
        isAddingColumn={isAddingColumn}
      />

      {/* SingleTaskView modal */}
      {(selectedTaskId || addTaskColumnId) && (
        <SingleTaskView
          key={selectedTaskId ?? `add-${addTaskColumnId}`}
          taskId={selectedTaskId!}
          mode={selectedTaskId ? "edit" : "add"}
          columns={localColumns}
          boardId={boardId}
          columnId={(addTaskColumnId || selectedTaskColumnId) as string}
          onClose={() => {
            setSelectedTaskId(null);
            setAddTaskColumnId(null);
            fetchBoardData();
          }}
          onTaskUpdate={() => {
            setSelectedTaskId(null);
            fetchBoardData();
          }}
          onTaskAdded={() => {
            setAddTaskColumnId(null);
            fetchBoardData();
          }}
          currentUser={currentUser!}
        />
      )}
    </div>
  );
};

export default Page;

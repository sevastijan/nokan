// src/app/(your-folder)/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import Loader from "@/app/components/Loader";
import { extractTaskIdFromUrl } from "@/app/utils/helpers";
import { getPriorities } from "@/app/lib/api";
import {
  Column as ColumnType,
  Task as TaskType,
  User,
  Priority,
} from "@/app/types/globalTypes";
import { FaArrowLeft, FaPlus, FaColumns } from "react-icons/fa";
import Button from "@/app/components/Button/Button";
import { toast } from "react-toastify";

const Page: React.FC = () => {
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
    handleAddTask,
    handleRemoveTask,
  } = useBoard(id!);

  const [localColumns, setLocalColumns] = useState<ColumnType[]>([]);
  const [boardTitle, setBoardTitle] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);

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

  // Load priorities
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

  // Ensure user record exists
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
          image: data.image!,
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
          image: d2.image!,
          created_at: d2.created_at!,
        });
      }
    })();
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  // Read ?task= from URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = extractTaskIdFromUrl(window.location.href);
    if (t) setSelectedTaskId(t);
  }, []);

  // Handlers for board title
  const onBoardTitleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setBoardTitle(e.target.value);
  const onBoardTitleBlur = () => {
    if (boardTitle.trim() !== board?.title) {
      handleUpdateBoardTitle(boardTitle.trim());
    }
  };

  // Add column popup
  const openAddColumn = () => setIsPopupOpen(true);
  const closeAddColumn = () => setIsPopupOpen(false);
  const onAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    setIsAddingColumn(true);
    await handleAddColumn(newColumnTitle.trim());
    setNewColumnTitle("");
    closeAddColumn();
    fetchBoardData();
    setIsAddingColumn(false);
  };

  // Add task
  const openAddTask = (colId: string) => setAddTaskColumnId(colId);
  const onTaskAdded = async (
    columnId: string,
    title: string,
    priority?: string,
    userId?: string
  ) => {
    const t = await handleAddTask(columnId, title, priority, userId);
    setLocalColumns((cols) =>
      cols.map((c) =>
        c.id === columnId ? { ...c, tasks: [...(c.tasks || []), t] } : c
      )
    );
    setAddTaskColumnId(null);
    return t;
  };

  // Remove task
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

      // COLUMN reorder
      if (type === "COLUMN") {
        const cols = Array.from(localColumns);
        const [m] = cols.splice(source.index, 1);
        cols.splice(destination.index, 0, m);
        setLocalColumns(cols);
        await Promise.all(
          cols.map((c, i) =>
            supabase.from("columns").update({ order: i }).eq("id", c.id)
          )
        );
        fetchBoardData();
        return;
      }

      // TASK reorder or move
      if (type === "TASK") {
        const cols = Array.from(localColumns);
        const srcIdx = cols.findIndex((c) => c.id === source.droppableId);
        const dstIdx = cols.findIndex((c) => c.id === destination.droppableId);
        if (srcIdx < 0 || dstIdx < 0) return;

        const srcTasks = Array.from(cols[srcIdx].tasks || []);
        const [moved] = srcTasks.splice(source.index, 1);

        if (srcIdx === dstIdx) {
          // same column
          srcTasks.splice(destination.index, 0, moved);
          const updated = srcTasks.map((t, i) => ({ ...t, order: i }));
          cols[srcIdx].tasks = updated;
          setLocalColumns(cols);
          await Promise.all(
            updated.map((t) =>
              supabase
                .from("tasks")
                .update({ sort_order: t.order })
                .eq("id", t.id)
            )
          );
        } else {
          // cross-column
          const dstTasks = Array.from(cols[dstIdx].tasks || []);
          dstTasks.splice(destination.index, 0, moved);

          const updatedSrc = srcTasks.map((t, i) => ({ ...t, order: i }));
          const updatedDst = dstTasks.map((t, i) => ({ ...t, order: i }));

          cols[srcIdx].tasks = updatedSrc;
          cols[dstIdx].tasks = updatedDst;
          setLocalColumns(cols);

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

        fetchBoardData();
      }
    },
    [localColumns, fetchBoardData]
  );

  // Loading / error states
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 flex items-center gap-4">
        <FaColumns className="text-white text-2xl" />
        <input
          className="bg-transparent text-white text-2xl font-semibold w-full focus:outline-none"
          value={boardTitle}
          onChange={onBoardTitleChange}
          onBlur={onBoardTitleBlur}
          placeholder="Board title…"
        />
        <Button
          variant="ghost"
          icon={<FaPlus />}
          onClick={openAddColumn}
          className="text-green-400 hover:text-green-300"
        >
          Add Column
        </Button>
      </header>

      {/* BODY */}
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
              className="flex-1 flex overflow-x-auto p-6 gap-6 h-full"
            >
              {localColumns.map((col, idx) => (
                <Draggable key={col.id} draggableId={col.id} index={idx}>
                  {(prov) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      style={prov.draggableProps.style}
                      className="flex-shrink-0 flex h-full p-1"
                    >
                      {/* Glass wrapper without backdrop-filter */}
                      <div
                        className="
                        bg-white/10 dark:bg-gray-900/20
                        rounded-lg
                        border border-white/30 dark:border-gray-700/30
                        ring-1 ring-white/10 ring-offset-1 ring-offset-transparent
                        shadow-md
                        transition
                      "
                      >
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

      {/* Popups & Modals */}
      <AddColumnPopup
        isOpen={isPopupOpen}
        onClose={closeAddColumn}
        onAddColumn={onAddColumn}
        newColumnTitle={newColumnTitle}
        setNewColumnTitle={setNewColumnTitle}
        isAddingColumn={isAddingColumn}
      />

      {(selectedTaskId || addTaskColumnId) && (
        <SingleTaskView
          key={selectedTaskId ?? `add-${addTaskColumnId}`}
          taskId={selectedTaskId!}
          mode={selectedTaskId ? "edit" : "add"}
          boardId={id!}
          columnId={addTaskColumnId || undefined}
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

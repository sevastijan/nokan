"use client";

import { useState, useEffect, useMemo } from "react";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { FaRegCalendarDays } from "react-icons/fa6";
import {
  useGetUserBoardsQuery,
  useGetTasksByBoardsAndDateQuery,
  useGetColumnsByBoardIdQuery, // now available
} from "@/app/store/slices/calendarApiSlice";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
  max as dateMax,
  min as dateMin,
} from "date-fns";
import Button from "@/app/components/Button/Button";
import Avatar from "@/app/components/Avatar/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import type { User } from "@/app/types/globalTypes";

// Interface for a processed task in calendar:
interface ProcessedTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  assignee?: User | null;
}

const Calendar = () => {
  // Current user
  const { currentUser, loading: userLoading, authStatus } = useCurrentUser();
  const userId = currentUser?.id;

  // Fetch boards for the user
  const {
    data: boards = [],
    isLoading: boardsLoading,
    isError: boardsError,
  } = useGetUserBoardsQuery(userId ?? "", { skip: !userId });

  // Selected boardId state: undefined means “not yet chosen”
  const [selectedBoardId, setSelectedBoardId] = useState<string | undefined>(
    undefined
  );

  // Auto-select if exactly one board
  useEffect(() => {
    if (boards.length === 1) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards]);

  // Fetch columns for the selected board
  const {
    data: columns = [],
    isLoading: columnsLoading,
    isError: columnsError,
  } = useGetColumnsByBoardIdQuery(selectedBoardId ?? "", {
    skip: !selectedBoardId,
  });

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const fetchStart = format(monthStart, "yyyy-MM-dd");
  const fetchEnd = format(monthEnd, "yyyy-MM-dd");

  // Determine boardIds to fetch: only after board is selected
  const boardIdsToFetch = selectedBoardId ? [selectedBoardId] : [];

  // Fetch tasks overlapping the month
  const {
    data: tasksRaw = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useGetTasksByBoardsAndDateQuery(
    { boardIds: boardIdsToFetch, start: fetchStart, end: fetchEnd },
    { skip: !selectedBoardId || boardIdsToFetch.length === 0 }
  );

  // Modal state:
  // Show board-select modal initially if no board selected
  const [boardSelectModalOpen, setBoardSelectModalOpen] = useState<boolean>(
    selectedBoardId == null
  );
  // Whenever selectedBoardId becomes non-null, close the modal automatically
  useEffect(() => {
    if (selectedBoardId) {
      setBoardSelectModalOpen(false);
    }
  }, [selectedBoardId]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    undefined
  );
  // New: wybrana kolumna przy tworzeniu
  const [selectedColumnForNew, setSelectedColumnForNew] = useState<
    string | undefined
  >(undefined);

  // Whenever columns load and mamy modal add otwarty, lub resetujemy modal, ustawiamy domyślną kolumnę
  useEffect(() => {
    if (isTaskModalOpen && taskModalMode === "add" && columns.length > 0) {
      // jeśli jeszcze nie ustawiono, wybierz pierwszą
      if (!selectedColumnForNew) {
        setSelectedColumnForNew(columns[0].id);
      }
    }
  }, [columns, isTaskModalOpen, taskModalMode, selectedColumnForNew]);

  // Filter UI state placeholder
  const [filterOpen, setFilterOpen] = useState(false);

  // Generate weeks grid for current month
  const weeks = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const wks: Date[][] = [];
    let curr = start;
    while (curr <= end) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(addDays(curr, i));
      }
      wks.push(week);
      curr = addDays(curr, 7);
    }
    return wks;
  }, [monthStart, monthEnd]);

  // Process tasksRaw → ProcessedTask[] including assignee
  const tasksProcessed: ProcessedTask[] = useMemo(() => {
    if (!tasksRaw) return [];
    return tasksRaw
      .map((t) => {
        if (!t.start_date) return null;
        try {
          const s = parseISO(t.start_date);
          const e = t.end_date ? parseISO(t.end_date) : s;
          const assignee = (t as any).assignee ?? null;
          return {
            id: t.id!,
            title: t.title ?? "",
            start: s,
            end: e,
            assignee,
          } as ProcessedTask;
        } catch {
          return null;
        }
      })
      .filter((x): x is ProcessedTask => x !== null);
  }, [tasksRaw]);

  // Organize tasks per week for bars
  type TaskForWeek = {
    id: string;
    title: string;
    assignee?: User | null;
    colStart: number;
    colSpan: number;
  };
  const tasksByWeek: TaskForWeek[][] = useMemo(() => {
    return weeks.map((week) => {
      const rowStart = week[0];
      const rowEnd = week[6];
      const rowTasks: TaskForWeek[] = [];
      tasksProcessed.forEach((t) => {
        const rs = dateMax([t.start, rowStart]);
        const re = dateMin([t.end, rowEnd]);
        if (rs <= re) {
          const startIdx = differenceInCalendarDays(rs, rowStart);
          const endIdx = differenceInCalendarDays(re, rowStart);
          rowTasks.push({
            id: t.id,
            title: t.title,
            assignee: t.assignee,
            colStart: startIdx + 1,
            colSpan: endIdx - startIdx + 1,
          });
        }
      });
      return rowTasks;
    });
  }, [weeks, tasksProcessed]);

  // Handlers
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setSelectedTaskId(undefined);
    setTaskModalMode("add");
    setSelectedColumnForNew(undefined); // wymusi wybór domyślnej kolumny po załadowaniu columns
    setIsTaskModalOpen(true);
  };
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskModalMode("edit");
    setSelectedColumnForNew(undefined);
    setIsTaskModalOpen(true);
  };
  const prevMonth = () => setCurrentMonth((m) => addDays(startOfMonth(m), -1));
  const nextMonth = () => setCurrentMonth((m) => addDays(endOfMonth(m), 1));
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedDate(undefined);
    setSelectedTaskId(undefined);
    setSelectedColumnForNew(undefined);
  };
  // Close board-select modal even if no board chosen
  const closeBoardSelectModal = () => {
    setBoardSelectModalOpen(false);
  };

  // Loading / auth checks
  if (authStatus === "loading" || userLoading || boardsLoading) {
    return (
      <div className="p-4 text-center text-white">Loading calendar...</div>
    );
  }
  if (authStatus === "unauthenticated" || !userId) {
    return (
      <div className="p-4 text-center text-white">
        Please log in to view your calendar.
      </div>
    );
  }
  if (boardsError) {
    return (
      <div className="p-4 text-center text-red-400">
        Failed to load your boards.
      </div>
    );
  }

  return (
    <>
      {/* Board-select modal */}
      <AnimatePresence>
        {boardSelectModalOpen && (
          <motion.div
            key="board-select-overlay"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 text-white rounded-lg w-full max-w-lg shadow-xl border border-slate-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Header with gradient, icon, title, close button */}
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <FaRegCalendarDays className="text-white w-5 h-5" />
                  <h3 className="text-white text-lg font-semibold">
                    Select board
                  </h3>
                </div>
                <button
                  onClick={closeBoardSelectModal}
                  className="text-white hover:text-slate-200"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
              {/* Subtitle below header */}
              <div className="px-6 pt-4 pb-2">
                <p className="text-slate-400 text-sm">
                  Select board to display calendar!
                </p>
              </div>

              <div className="px-6 pb-6">
                {boards.length === 0 ? (
                  <p className="text-sm mb-4">
                    No boards available. Create a board to use the calendar.
                  </p>
                ) : (
                  <>
                    <select
                      className="w-full p-2 mb-4 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={selectedBoardId ?? ""}
                      onChange={(e) =>
                        setSelectedBoardId(e.target.value || undefined)
                      }
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {boards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={closeBoardSelectModal}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={closeBoardSelectModal}
                        disabled={!selectedBoardId}
                      >
                        Continue
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* If modal was closed without selecting a board, show prompt */}
      {!boardSelectModalOpen && !selectedBoardId && (
        <div className="p-6 text-center text-white">
          <p className="text-lg font-medium">Calendar not initialized.</p>
          <p className="text-sm text-slate-400 mt-2">
            Please refresh the page to select a board.
          </p>
        </div>
      )}

      {/* Render calendar only after board is chosen */}
      {!boardSelectModalOpen && selectedBoardId && (
        <div className="flex flex-col space-y-4 p-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 rounded-lg border border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="md"
                className="text-white hover:bg-slate-700"
                onClick={prevMonth}
              >
                <FaChevronLeft />
              </Button>
              <h2 className="text-white text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="ghost"
                size="md"
                className="text-white hover:bg-slate-700"
                onClick={nextMonth}
              >
                <FaChevronRight />
              </Button>
            </div>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Button
                variant="ghost"
                size="md"
                icon={<FaFilter />}
                onClick={() => setFilterOpen(true)}
                className="text-white border border-white/30 hover:bg-slate-700"
              >
                Filter
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  const todayStr = format(new Date(), "yyyy-MM-dd");
                  setSelectedDate(todayStr);
                  setSelectedTaskId(undefined);
                  setTaskModalMode("add");
                  setSelectedColumnForNew(undefined);
                  setIsTaskModalOpen(true);
                }}
              >
                + Add Task
              </Button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 text-center text-sm font-medium text-slate-300">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid auto-rows-fr">
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="grid grid-cols-7 border-t border-slate-700 relative"
              >
                {/* Day cells */}
                {week.map((day) => {
                  const inMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());
                  const baseBg = inMonth ? "bg-slate-800" : "bg-slate-700";
                  // Highlight today with a subtle gradient overlay
                  const todayClasses = isToday
                    ? "relative z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-purple-600/20 before:to-transparent before:rounded-lg"
                    : "";
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-20 border-r border-slate-700 p-1 cursor-pointer flex flex-col ${baseBg} ${todayClasses}`}
                      onClick={() => handleDateClick(day)}
                    >
                      <div
                        className={`text-xs font-medium text-right ${
                          inMonth ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                      {/* empty space for events */}
                    </div>
                  );
                })}

                {/* Task bars overlay */}
                <div className="absolute top-6 left-0 right-0 pointer-events-none">
                  {tasksByWeek[wi].map((t) => {
                    const leftPct = ((t.colStart - 1) / 7) * 100;
                    const widthPct = (t.colSpan / 7) * 100;
                    return (
                      <div
                        key={t.id}
                        className="absolute flex items-center bg-purple-600 text-white text-xs px-1 rounded cursor-pointer pointer-events-auto"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: 0,
                          height: "1.25rem",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(t.id);
                        }}
                      >
                        {t.assignee?.image ? (
                          <Avatar
                            src={t.assignee.image}
                            alt={t.assignee.name}
                            size={16}
                            className="mr-1 border border-white/30"
                          />
                        ) : null}
                        <span className="truncate">{t.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Filter placeholder modal */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-slate-800 text-white p-6 rounded-lg max-w-md w-full border border-slate-700 shadow-xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <h3 className="text-lg font-semibold mb-4">Filter Tasks</h3>
                  {/* TODO: implement filter UI fields */}
                  <p className="text-sm text-slate-300">Filter UI goes here.</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setFilterOpen(false)}
                      className="mr-2"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setFilterOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add/Edit Task Modal */}
          <AnimatePresence>
            {isTaskModalOpen && selectedBoardId && (
              <motion.div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-slate-800 text-white rounded-lg max-w-3xl w-full h-full md:h-auto overflow-auto"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                >
                  <SingleTaskView
                    taskId={
                      taskModalMode === "edit" ? selectedTaskId : undefined
                    }
                    mode={taskModalMode === "edit" ? "edit" : "add"}
                    columnId={
                      taskModalMode === "edit"
                        ? tasksRaw.find((t) => t.id === selectedTaskId)
                            ?.column_id ?? undefined
                        : selectedColumnForNew
                    }
                    boardId={selectedBoardId}
                    initialStartDate={selectedDate}
                    onClose={closeTaskModal}
                    onTaskAdded={() => {
                      // po dodaniu: odśwież zadania w kalendarzu
                      refetchTasks();
                    }}
                    onTaskUpdate={() => {
                      // po edycji: odśwież zadania
                      refetchTasks();
                      closeTaskModal();
                    }}
                    currentUser={currentUser!}
                    columns={columns}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default Calendar;

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/Loader";
import Button from "@/app/components/Button/Button";
import Calendar from "@/app/components/Calendar/Calendar";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
import BoardSelect from "@/app/components/Calendar/BoardSelect"; // NEW!
import {
  useGetCurrentUserQuery,
  useGetMyBoardsQuery,
  useGetTasksWithDatesQuery,
} from "@/app/store/apiSlice";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCalendarWeek,
  FaCalendarDay,
  FaFilter,
} from "react-icons/fa";
import { CalendarEvent } from "@/app/types/globalTypes";

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent":
      return "#ef4444";
    case "medium":
    case "normal":
      return "#f59e0b";
    case "low":
      return "#10b981";
    default:
      return "#6b7280";
  }
};

const CalendarPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const {
    data: currentUser,
    isFetching: userFetching,
    error: userError,
  } = useGetCurrentUserQuery(session!, {
    skip: sessionStatus !== "authenticated" || !session,
  });

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [sessionStatus, router]);

  const userId = currentUser?.id ?? "";
  const {
    data: boards,
    isFetching: boardsFetching,
    error: boardsError,
  } = useGetMyBoardsQuery(userId, {
    skip: !userId,
  });

  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  // Board options for select
  const boardOptions = useMemo(
    () => boards?.map((b) => ({ label: b.title, value: b.id })) ?? [],
    [boards]
  );

  useEffect(() => {
    if (boards && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const {
    data: events,
    isFetching: eventsFetching,
    error: eventsError,
  } = useGetTasksWithDatesQuery(selectedBoardId, {
    skip: !selectedBoardId,
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [showFilters, setShowFilters] = useState(false);

  const handleTaskClick = (taskId: string) => setSelectedTaskId(taskId);
  const handleCloseTask = () => setSelectedTaskId(null);
  const handleTaskUpdate = () => setSelectedTaskId(null);
  const handleBackToDashboard = () => router.push("/dashboard");

  const loading = sessionStatus === "loading" || userFetching || boardsFetching;

  if (loading) return <Loader text="Loading calendar..." />;
  if (sessionStatus !== "authenticated") return null;
  if (userError)
    return <div className="p-8 text-red-400">Error loading user data</div>;
  if (boardsError)
    return <div className="p-8 text-red-400">Error loading boards</div>;

  const calendarEvents: CalendarEvent[] = (events ?? []).map((task) => {
    const start = task.start_date ?? new Date().toISOString();
    const rawEnd = task.end_date ?? task.start_date ?? new Date().toISOString();
    const endDate = new Date(rawEnd);
    endDate.setDate(endDate.getDate() + 1); // make inclusive
    const end = endDate.toISOString().split("T")[0];

    const priority =
      typeof task.priority === "string"
        ? task.priority
        : //@ts-expect-error
          task.priority?.label ?? "low";

    const color = getPriorityColor(priority);

    return {
      id: task.id,
      title: task.title ?? "Unnamed Task",
      start,
      end,
      priority,
      assignee: task.assignee ?? null,
      description: task.description ?? "",
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        priority,
        assignee: task.assignee ?? null,
        description: task.description ?? "",
      },
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* HEADER */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="flex flex-col md:flex-row gap-3 md:gap-6 px-2 md:px-8 py-4 md:items-center md:justify-between">
          {/* Left: Back + Title + Select */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              icon={<FaArrowLeft />}
              onClick={handleBackToDashboard}
              className="text-slate-400 hover:text-white"
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white whitespace-nowrap">
              Task Calendar
            </h1>
            <div className="w-full sm:w-64 min-w-0">
              <BoardSelect
                value={selectedBoardId}
                onChange={setSelectedBoardId}
                options={boardOptions}
                placeholder="Select a board..."
                className="w-full"
              />
            </div>
          </div>
          {/* Right: View Mode Buttons */}
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <Button
              variant={viewMode === "month" ? "primary" : "ghost"}
              size="sm"
              icon={<FaCalendarAlt />}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "primary" : "ghost"}
              size="sm"
              icon={<FaCalendarWeek />}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "primary" : "ghost"}
              size="sm"
              icon={<FaCalendarDay />}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FaFilter />}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              Filters
            </Button>
          </div>
        </div>
      </div>
      {/* CALENDAR */}
      <div className="p-2 md:p-8">
        {selectedBoardId && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-1 md:p-6">
            {typeof events === "undefined" && eventsFetching ? (
              <Loader text="Loading events..." />
            ) : eventsError ? (
              <div className="text-red-400">Error loading events</div>
            ) : (
              <Calendar
                events={calendarEvents}
                viewMode={viewMode}
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        )}
      </div>
      {/* TASK MODAL */}
      {selectedTaskId && currentUser && (
        <SingleTaskView
          taskId={selectedTaskId}
          key={`edit-${selectedTaskId}`}
          mode="edit"
          onClose={handleCloseTask}
          onTaskUpdate={handleTaskUpdate}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default CalendarPage;

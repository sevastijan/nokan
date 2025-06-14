"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/Loader";
import Button from "@/app/components/Button/Button";
import Calendar from "@/app/components/Calendar/Calendar";
import SingleTaskView from "@/app/components/SingleTaskView/SingleTaskView";
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
  FaPlus,
} from "react-icons/fa";

/**
 * CalendarPage: Shows a header with "Back to Dashboard", board selector, view toggles, and a Filters placeholder.
 * When a board is selected, fetches tasks-with-dates via RTK Query and passes to Calendar component.
 * Clicking a task opens SingleTaskView modal for editing.
 */
const CalendarPage: React.FC = () => {
  const router = useRouter();

  // NextAuth session
  const { data: session, status: sessionStatus } = useSession();

  // 1) Fetch Supabase user via RTK Query: pass session when authenticated
  const {
    data: currentUser,
    isFetching: userFetching,
    error: userError,
  } = useGetCurrentUserQuery(session!, {
    skip: sessionStatus !== "authenticated" || !session,
  });

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [sessionStatus, router]);

  // 2) Fetch boards for this user
  const userId = currentUser?.id ?? "";
  const {
    data: boards,
    isFetching: boardsFetching,
    error: boardsError,
  } = useGetMyBoardsQuery(userId, {
    skip: !userId,
  });

  // State: selected board ID
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  // 3) Fetch tasks-with-dates for selected board via RTK Query
  const {
    data: events,
    isFetching: eventsFetching,
    error: eventsError,
  } = useGetTasksWithDatesQuery(selectedBoardId, {
    skip: !selectedBoardId,
  });

  // State: which task is open for detail/edit
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // State: calendar view mode
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // State: show filters placeholder
  const [showFilters, setShowFilters] = useState(false);

  // Click handler for calendar event/task
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };
  const handleCloseTask = () => {
    setSelectedTaskId(null);
  };
  const handleTaskUpdate = () => {
    // After updating a task, RTK Query will auto-refetch if tags invalidated
    setSelectedTaskId(null);
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  // Combined loading state
  const loading = sessionStatus === "loading" || userFetching || boardsFetching;

  // Render loader while loading auth/user/boards
  if (loading) {
    return <Loader text="Loading calendar..." />;
  }
  // If still unauthenticated, return null (redirect in useEffect)
  if (sessionStatus !== "authenticated") {
    return null;
  }
  // If error fetching user
  if (userError) {
    return <div className="p-8 text-red-400">Error loading user data</div>;
  }
  // If error fetching boards
  if (boardsError) {
    return <div className="p-8 text-red-400">Error loading boards</div>;
  }

  // For stats: total events count, due today count, etc.
  const totalEventsCount = events?.length ?? 0;
  const todayISO = new Date().toISOString().slice(0, 10);
  const dueTodayCount = (events ?? []).filter((t) => {
    // Compare due_date if exists
    if (t.due_date) {
      return t.due_date.slice(0, 10) === todayISO;
    }
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-6 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                icon={<FaArrowLeft />}
                onClick={handleBackToDashboard}
                className="text-slate-400 hover:text-white"
              >
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
                  <FaCalendarAlt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Task Calendar
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {selectedBoardId
                      ? `Viewing: ${
                          boards?.find((b) => b.id === selectedBoardId)
                            ?.title || ""
                        }`
                      : boards && boards.length > 0
                      ? "Select a board to view tasks"
                      : "No boards available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Board selector, view toggles, filters */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Board Selector */}
              {boards && boards.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                  >
                    <option value="">Select a board...</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.title}
                      </option>
                    ))}
                  </select>
                  {/* Down arrow icon */}
                  <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-700/30 rounded-xl p-1">
                <Button
                  variant={viewMode === "month" ? "primary" : "ghost"}
                  size="sm"
                  icon={<FaCalendarAlt />}
                  onClick={() => setViewMode("month")}
                  className="rounded-lg"
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === "week" ? "primary" : "ghost"}
                  size="sm"
                  icon={<FaCalendarWeek />}
                  onClick={() => setViewMode("week")}
                  className="rounded-lg"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "day" ? "primary" : "ghost"}
                  size="sm"
                  icon={<FaCalendarDay />}
                  onClick={() => setViewMode("day")}
                  className="rounded-lg"
                >
                  Day
                </Button>
              </div>

              {/* Filters toggle placeholder */}
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

          {/* Filters Bar (placeholder only) */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1">
                    Priority
                  </label>
                  <select className="bg-slate-600/50 border border-slate-500/50 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1">
                    Status
                  </label>
                  <select className="bg-slate-600/50 border border-slate-500/50 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1">
                    Assignee
                  </label>
                  <select className="bg-slate-600/50 border border-slate-500/50 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All assignees</option>
                    <option value="me">Assigned to me</option>
                    <option value="others">Others</option>
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-6 text-slate-400 hover:text-white"
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* No boards at all */}
        {boards && boards.length === 0 && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center p-12">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 max-w-md mx-auto">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No boards available
                </h3>
                <p className="text-slate-400 mb-6">
                  You don't have access to any boards yet. Create one to get
                  started!
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBackToDashboard}
                  icon={<FaPlus />}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Boards exist but none selected */}
        {boards && boards.length > 0 && !selectedBoardId && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center p-12">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 max-w-md mx-auto">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Select a board
                </h3>
                <p className="text-slate-400 mb-6">
                  Choose a board from the dropdown above to view its tasks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Board selected: show stats and calendar */}
        {selectedBoardId && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {totalEventsCount}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">With dates</p>
                  </div>
                  <div className="bg-blue-500/30 p-3 rounded-xl">
                    <FaCalendarAlt className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      Due Today
                    </p>
                    <p className="text-2xl font-bold mt-1">{dueTodayCount}</p>
                    <p className="text-green-200 text-xs mt-1">Attention</p>
                  </div>
                  <div className="bg-green-500/30 p-3 rounded-xl">
                    <FaCalendarDay className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      View Mode
                    </p>
                    <p className="text-2xl font-bold mt-1 capitalize">
                      {viewMode}
                    </p>
                    <p className="text-purple-200 text-xs mt-1">Calendar</p>
                  </div>
                  <div className="bg-purple-500/30 p-3 rounded-xl">
                    <FaCalendarWeek className="w-5 h-5" />
                  </div>
                </div>
              </div>
              {/* You can add other stat cards, e.g. Completed this month, etc. */}
            </div>

            {/* Calendar container */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              {eventsFetching ? (
                <Loader text="Loading events..." />
              ) : eventsError ? (
                <div className="text-red-400">Error loading events</div>
              ) : (
                <Calendar
                  events={events || []}
                  viewMode={viewMode}
                  onTaskClick={handleTaskClick}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Task Details Modal */}
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

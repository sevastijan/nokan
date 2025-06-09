"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Calendar from "../components/Calendar/Calendar";
import SingleTaskView from "../components/SingleTaskView/SingleTaskView";
import { useCalendar } from "../hooks/useCalendar";
import { useBoards } from "../hooks/useBoards";
import { useCurrentUser } from "../hooks/useCurrentUser";
import Loader from "../components/Loader";
import Button from "../components/Button/Button";
import Avatar from "../components/Avatar/Avatar";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaFilter,
  FaPlus,
  FaArrowLeft,
  FaClock,
  FaTasks,
  FaUsers,
  FaCalendarWeek,
  FaCalendarDay,
  FaListUl,
} from "react-icons/fa";

const CalendarPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { refreshKey, refreshCalendar } = useCalendar();
  const {
    boards,
    selectedBoardId,
    setSelectedBoardId,
    loading: boardsLoading,
  } = useBoards(session?.user?.email || null);
  const { currentUser, loading: userLoading } = useCurrentUser(session);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [showFilters, setShowFilters] = useState(false);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseTask = () => {
    setSelectedTaskId(null);
  };

  const handleTaskUpdate = () => {
    refreshCalendar();
    setSelectedTaskId(null);
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (status === "loading" || boardsLoading || userLoading) {
    return <Loader text="Loading calendar..." />;
  }

  if (!session) {
    return null;
  }

  const selectedBoard = boards.find((board) => board.id === selectedBoardId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation & Title */}
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                icon={<FaArrowLeft />}
                onClick={handleBackToDashboard}
                className="text-slate-400 hover:text-white"
              >
                Back to Dashboard
              </Button>

              <div className="h-6 w-px bg-slate-600"></div>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
                  <FaCalendarAlt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Task Calendar
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {selectedBoard
                      ? `Viewing ${selectedBoard.title}`
                      : "Select a board to view tasks"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - User & Actions */}
            <div className="flex items-center gap-4">
              {/* Board Selector */}
              {boards.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 pr-10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
                  >
                    <option value="">Select a board...</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.title}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
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

              {/* Filters */}
              <Button
                variant="secondary"
                size="sm"
                icon={<FaFilter />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
              <div className="flex items-center gap-4">
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
                    <option value="progress">In Progress</option>
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
        {selectedBoardId ? (
          <>
            {/* Calendar Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      This Month
                    </p>
                    <p className="text-2xl font-bold mt-1">24</p>
                    <p className="text-blue-200 text-xs mt-1">Total tasks</p>
                  </div>
                  <div className="bg-blue-500/30 p-3 rounded-xl">
                    <FaTasks className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      Completed
                    </p>
                    <p className="text-2xl font-bold mt-1">16</p>
                    <p className="text-green-200 text-xs mt-1">67% done</p>
                  </div>
                  <div className="bg-green-500/30 p-3 rounded-xl">
                    <FaListUl className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Due Today
                    </p>
                    <p className="text-2xl font-bold mt-1">3</p>
                    <p className="text-orange-200 text-xs mt-1">
                      Need attention
                    </p>
                  </div>
                  <div className="bg-orange-500/30 p-3 rounded-xl">
                    <FaClock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Team Tasks
                    </p>
                    <p className="text-2xl font-bold mt-1">8</p>
                    <p className="text-purple-200 text-xs mt-1">
                      Collaborative
                    </p>
                  </div>
                  <div className="bg-purple-500/30 p-3 rounded-xl">
                    <FaUsers className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Container */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <Calendar
                key={refreshKey}
                boardId={selectedBoardId}
                onTaskClick={handleTaskClick}
                viewMode={viewMode}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center p-12">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 max-w-md mx-auto">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {boards.length === 0
                    ? "No boards available"
                    : "Select a board"}
                </h3>
                <p className="text-slate-400 mb-6">
                  {boards.length === 0
                    ? "You don't have access to any boards yet. Create one to get started!"
                    : "Choose a board from the dropdown to view its tasks in calendar format."}
                </p>
                {boards.length === 0 && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleBackToDashboard}
                    icon={<FaPlus />}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTaskId && currentUser && (
        <SingleTaskView
          taskId={selectedTaskId}
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

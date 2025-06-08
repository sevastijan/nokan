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

  if (status === "loading" || boardsLoading || userLoading) {
    return <Loader text="Loading" />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Task Calendar</h1>
          {boards.length > 1 && (
            <div className="flex items-center space-x-3">
              <label className="text-gray-300 font-medium">Board:</label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {selectedBoardId ? (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <Calendar
              key={refreshKey}
              boardId={selectedBoardId}
              onTaskClick={handleTaskClick}
            />
          </div>
        ) : (
          !boardsLoading && (
            <div className="text-center text-gray-400 mt-12">
              <p>You don't have access to any boards yet.</p>
            </div>
          )
        )}
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
    </div>
  );
};

export default CalendarPage;

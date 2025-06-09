"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import BoardList from "../components/Board/BoardList";
import Loader from "../components/Loader";
import Button from "../components/Button/Button";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaBell,
  FaChartLine,
  FaUsers,
  FaCalendarAlt,
  FaTasks,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

/**
 * Dashboard page component that displays user's boards
 * Requires authentication to access
 * @returns JSX element containing the dashboard interface
 */
const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalBoards: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
  });

  // Check session status - loading, authenticated, unauthenticated
  if (status === "loading") {
    return <Loader text="Loading dashboards..." />;
  }

  // If user is not authenticated, redirect to sign in page
  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Welcome */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {session?.user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-slate-400">
                  Here's what's happening with your projects today
                </p>
              </div>
            </div>

            {/* Right side - Actions only */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Boards
                </p>
                <p className="text-3xl font-bold mt-2">{stats.totalBoards}</p>
                <p className="text-blue-200 text-sm mt-2 flex items-center gap-1">
                  <FaArrowRight className="w-3 h-3" />
                  View all boards
                </p>
              </div>
              <div className="bg-blue-500/30 p-3 rounded-xl">
                <FaTasks className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Completed Tasks
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.completedTasks}
                </p>
                <p className="text-green-200 text-sm mt-2 flex items-center gap-1">
                  <FaChartLine className="w-3 h-3" />
                  +12% from last week
                </p>
              </div>
              <div className="bg-green-500/30 p-3 rounded-xl">
                <FaChartLine className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Team Members
                </p>
                <p className="text-3xl font-bold mt-2">{stats.teamMembers}</p>
                <p className="text-purple-200 text-sm mt-2 flex items-center gap-1">
                  <FaUsers className="w-3 h-3" />
                  Active collaborators
                </p>
              </div>
              <div className="bg-purple-500/30 p-3 rounded-xl">
                <FaUsers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Due Today</p>
                <p className="text-3xl font-bold mt-2">{stats.totalTasks}</p>
                <p className="text-orange-200 text-sm mt-2 flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  Tasks need attention
                </p>
              </div>
              <div className="bg-orange-500/30 p-3 rounded-xl">
                <FaClock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Boards</h2>
            <p className="text-slate-400">Manage and organize your projects</p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="secondary" size="md" icon={<FaFilter />}>
              Filter
            </Button>

            <Button variant="secondary" size="md" icon={<FaCalendarAlt />}>
              Calendar View
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={<FaPlus />}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Create Board
            </Button>
          </div>
        </div>

        {/* Boards Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <BoardList searchQuery={searchQuery} />
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {/* Activity items - placeholder */}
              <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm">You created a new board</p>
                  <p className="text-slate-400 text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm">
                    Task completed in Dev board
                  </p>
                  <p className="text-slate-400 text-xs">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4">This Week</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tasks Created</span>
                <span className="text-white font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Tasks Completed</span>
                <span className="text-green-400 font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Boards Created</span>
                <span className="text-blue-400 font-semibold">2</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: "67%" }}
                ></div>
              </div>
              <p className="text-slate-400 text-sm">
                67% of weekly goals completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

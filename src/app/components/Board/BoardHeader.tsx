"use client";
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiPlus,
} from "react-icons/fi";
import { useOutsideClick } from "@/app/hooks/useOutsideClick";

interface PriorityOption {
  id: string;
  label: string;
  color: string;
}
interface AssigneeOption {
  id: string;
  name: string;
}

interface BoardHeaderProps {
  boardTitle: string;
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTitleBlur: () => void;
  onAddColumn: () => void;
  viewMode: "columns" | "list";
  onViewModeChange: (mode: "columns" | "list") => void;
  totalTasks: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  priorities: PriorityOption[];
  filterPriority: string | null;
  onFilterPriorityChange: (prio: string | null) => void;
  assignees: AssigneeOption[];
  filterAssignee: string | null;
  onFilterAssigneeChange: (assigneeId: string | null) => void;
}

const BoardHeader = ({
  boardTitle,
  onTitleChange,
  onTitleBlur,
  onAddColumn,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  priorities,
  filterPriority,
  onFilterPriorityChange,
  assignees,
  filterAssignee,
  onFilterAssigneeChange,
}: BoardHeaderProps) => {
  const router = useRouter();

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useOutsideClick([filterRef], () => {
    if (filterOpen) setFilterOpen(false);
  });

  // Handler fns
  const handleBack = () => router.push("/dashboard");
  const handleSearchIconClick = () => setShowMobileSearch((p) => !p);
  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) =>
    onSearchChange(e.target.value);
  const handleFilterToggle = () => setFilterOpen((p) => !p);
  const handleClearFilters = () => {
    onFilterPriorityChange(null);
    onFilterAssigneeChange(null);
  };
  const handleViewToggle = (mode: "columns" | "list") => onViewModeChange(mode);
  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  };

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-purple-700 to-purple-800 shadow">
      <div className="w-full px-3 sm:px-6 lg:px-8 pt-4 pb-3 flex flex-col gap-2">
        {/* === Row 1: Back & Title (always together) === */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBack}
            className="flex items-center px-3 py-2 bg-purple-900/30 hover:bg-purple-700/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            aria-label="Back to dashboard"
          >
            <FiArrowLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <input
            type="text"
            className="bg-transparent py-2 text-xl font-semibold text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg flex-1 min-w-0"
            style={{ minWidth: 0 }}
            placeholder="Board title…"
            value={boardTitle}
            onChange={onTitleChange}
            onBlur={onTitleBlur}
            onKeyDown={handleTitleKeyDown}
          />
        </div>

        {/* === Row 2: Controls (search/filters/view/add) === */}
        <div
          className="
            flex flex-wrap items-center gap-2 
            w-full
            sm:flex-row
          "
        >
          {/* Search: icon on mobile, bar on sm+ */}
          <div className="flex-1 min-w-[120px] max-w-xs">
            <div className="relative hidden sm:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
              <input
                type="text"
                className="w-full py-2 pl-10 pr-4 bg-purple-900/30 placeholder-purple-300 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearchInputChange}
              />
            </div>
            <button
              className="sm:hidden p-2 rounded hover:bg-purple-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={handleSearchIconClick}
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={handleFilterToggle}
              className="flex items-center px-4 py-2 bg-purple-900/30 hover:bg-purple-700/30 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition w-full sm:w-auto"
              aria-haspopup="true"
              aria-expanded={filterOpen}
            >
              <FiFilter className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800/90 backdrop-blur-sm text-white rounded-lg shadow-lg ring-1 ring-black/30 z-40">
                <div className="p-3 space-y-3">
                  {/* Priority */}
                  <div>
                    <div className="text-sm font-semibold text-purple-200 mb-1">
                      Priority
                    </div>
                    <ul className="space-y-1 max-h-36 overflow-auto">
                      <li>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="filter-priority"
                            className="form-radio h-4 w-4 text-purple-500"
                            checked={filterPriority === null}
                            onChange={() => onFilterPriorityChange(null)}
                          />
                          <span className="text-sm">All</span>
                        </label>
                      </li>
                      {priorities.map((p) => (
                        <li key={p.id}>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="filter-priority"
                              className="form-radio h-4 w-4 text-purple-500"
                              checked={filterPriority === p.id}
                              onChange={() => onFilterPriorityChange(p.id)}
                            />
                            <span
                              className="text-sm px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: p.color,
                                color: "#fff",
                              }}
                            >
                              {p.label}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <hr className="border-slate-600" />
                  {/* Assignee */}
                  <div>
                    <div className="text-sm font-semibold text-purple-200 mb-1">
                      Assignee
                    </div>
                    <ul className="space-y-1 max-h-36 overflow-auto">
                      <li>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="filter-assignee"
                            className="form-radio h-4 w-4 text-purple-500"
                            checked={filterAssignee === null}
                            onChange={() => onFilterAssigneeChange(null)}
                          />
                          <span className="text-sm">All</span>
                        </label>
                      </li>
                      {assignees.map((u) => (
                        <li key={u.id}>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="filter-assignee"
                              className="form-radio h-4 w-4 text-purple-500"
                              checked={filterAssignee === u.id}
                              onChange={() => onFilterAssigneeChange(u.id)}
                            />
                            <span className="text-sm">{u.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-purple-300 hover:text-purple-100"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex bg-purple-900/30 rounded-lg overflow-hidden">
            <button
              onClick={() => handleViewToggle("columns")}
              className={`flex items-center justify-center px-4 py-2 text-sm ${
                viewMode === "columns"
                  ? "bg-purple-600 text-white"
                  : "text-purple-200 hover:bg-purple-700/30"
              } transition`}
            >
              <FiGrid className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => handleViewToggle("list")}
              className={`flex items-center justify-center px-4 py-2 text-sm ${
                viewMode === "list"
                  ? "bg-purple-600 text-white"
                  : "text-purple-200 hover:bg-purple-700/30"
              } transition`}
            >
              <FiList className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* Add Column button */}
          <button
            onClick={onAddColumn}
            className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          >
            <FiPlus className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Add Column</span>
          </button>
        </div>
      </div>

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-start p-4 pt-20">
          <div className="relative w-full max-w-md mx-auto">
            <div className="flex items-center bg-purple-900/80 rounded-md">
              <FiSearch className="ml-2 text-purple-300 w-5 h-5" />
              <input
                type="text"
                autoFocus
                className="flex-1 px-2 py-1 bg-transparent placeholder-purple-300 text-white focus:outline-none"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearchInputChange}
              />
              <button
                className="p-2"
                onClick={() => setShowMobileSearch(false)}
                aria-label="Close search"
              >
                <span className="text-white text-lg">×</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default BoardHeader;

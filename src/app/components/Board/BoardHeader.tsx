// src/app/components/Board/BoardHeader.tsx
"use client";

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiChevronRight,
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
  color: string; // hex or valid CSS color
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
  totalTasks,
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

  // Mobile search overlay toggle
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Filter dropdown
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  //@ts-expect-error
  useOutsideClick([filterRef], () => {
    if (filterOpen) setFilterOpen(false);
  });

  // Handlers
  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleViewToggle = (mode: "columns" | "list") => {
    onViewModeChange(mode);
  };

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSearchIconClick = () => {
    setShowMobileSearch((prev) => !prev);
  };

  const handleFilterToggle = () => {
    setFilterOpen((prev) => !prev);
  };

  const handleClearFilters = () => {
    onFilterPriorityChange(null);
    onFilterAssigneeChange(null);
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-purple-700 to-purple-800 text-gray-100 shadow-md">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center">
        {/* Left: Back + Breadcrumbs + Title */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Back arrow */}
          <button
            onClick={handleBack}
            className="p-2 rounded hover:bg-purple-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Breadcrumbs (sm+) */}
          <nav className="hidden sm:flex items-center text-sm text-purple-200 truncate">
            <Link href="/dashboard" className="hover:text-white">
              Home
            </Link>
            <FiChevronRight className="mx-1 w-4 h-4" />
            <span className="font-medium truncate">
              {boardTitle || "Untitled"}
            </span>
          </nav>

          {/* Editable Title */}
          <div className="flex-shrink flex-1 min-w-0">
            <input
              type="text"
              className="w-full bg-transparent text-lg sm:text-xl font-semibold text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 truncate"
              placeholder="Board title…"
              value={boardTitle}
              onChange={onTitleChange}
              onBlur={onTitleBlur}
              onKeyDown={handleTitleKeyDown}
            />
          </div>
        </div>

        {/* Spacer between left and right */}
        <div className="flex-1" />

        {/* Right: Search / Filters / View toggle / Add Column */}
        <div className="flex items-center space-x-2">
          {/* Search input on md+ */}
          <div className="hidden md:flex items-center relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" />
            <input
              type="text"
              className="pl-10 pr-3 py-1 bg-purple-900/30 placeholder-purple-300 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
          </div>

          {/* Mobile search icon */}
          <button
            className="md:hidden p-2 rounded hover:bg-purple-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={handleSearchIconClick}
            aria-label="Search"
          >
            <FiSearch className="w-5 h-5 text-white" />
          </button>

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
                    <span className="text-white text-lg">&times;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={handleFilterToggle}
              className="flex items-center px-2 py-1 text-sm font-medium rounded-md hover:bg-purple-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-haspopup="true"
              aria-expanded={filterOpen}
            >
              <FiFilter className="w-5 h-5 text-white" />
              <span className="ml-1 hidden sm:inline text-white">Filters</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800/90 backdrop-blur-sm text-white rounded-md shadow-lg ring-1 ring-black/30 z-40">
                <div className="p-3 space-y-3">
                  {/* Priority filter */}
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
                  {/* Assignee filter */}
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
          <div className="flex bg-purple-900/30 rounded-md overflow-hidden">
            <button
              onClick={() => handleViewToggle("columns")}
              className={`px-2 py-1 text-sm flex items-center justify-center ${
                viewMode === "columns"
                  ? "bg-purple-600 text-white"
                  : "text-purple-200 hover:bg-purple-700/30"
              }`}
              aria-label="Board view"
            >
              <FiGrid className="w-5 h-5" />
              <span className="ml-1 hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => handleViewToggle("list")}
              className={`px-2 py-1 text-sm flex items-center justify-center ${
                viewMode === "list"
                  ? "bg-purple-600 text-white"
                  : "text-purple-200 hover:bg-purple-700/30"
              }`}
              aria-label="List view"
            >
              <FiList className="w-5 h-5" />
              <span className="ml-1 hidden sm:inline">List</span>
            </button>
          </div>

          {/* Add Column */}
          <button
            onClick={onAddColumn}
            className="flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <FiPlus className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">Add Column</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default BoardHeader;

"use client";

import { useState, useRef } from "react";
import { FiSearch, FiFilter, FiUser, FiCalendar } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button/Button";
import { SearchAndFiltersProps } from "./types";

const SearchAndFilters = ({
  onSearch,
  onFilterChange,
}: SearchAndFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    assignee: "",
    priority: "",
    dueDate: "",
  });
  const filterButtonRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = { assignee: "", priority: "", dueDate: "" };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  const applyFilters = () => {
    onFilterChange?.(filters);
    setShowFilters(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Search Input - Dark Theme */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-4 py-2 w-64 border border-slate-600 bg-slate-700/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-200 placeholder-slate-400 text-sm transition-all duration-200 hover:border-slate-500"
        />
      </div>

      {/* Filter Button - Dark Theme */}
      <div ref={filterButtonRef}>
        <Button
          variant={showFilters ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 ${
            showFilters
              ? "!bg-slate-700 !text-slate-200 !border-slate-600"
              : "text-slate-300 hover:text-slate-100 hover:bg-slate-700/50"
          }`}
        >
          <FiFilter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Filter Dropdown - Dark Theme */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Assignee
                </label>
                <div className="flex items-center gap-2 p-3 border border-slate-600 bg-slate-700/30 rounded-lg hover:border-slate-500 transition-colors">
                  <FiUser className="w-4 h-4 text-slate-400" />
                  <select
                    className="flex-1 bg-transparent text-sm focus:outline-none text-slate-200"
                    value={filters.assignee}
                    onChange={(e) =>
                      handleFilterChange("assignee", e.target.value)
                    }
                  >
                    <option value="" className="bg-slate-800">
                      All assignees
                    </option>
                    <option value="me" className="bg-slate-800">
                      Assigned to me
                    </option>
                    <option value="unassigned" className="bg-slate-800">
                      Unassigned
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Priority
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      value: "low",
                      label: "Low",
                      color: "bg-green-100 text-green-700 border-green-200",
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    },
                    {
                      value: "high",
                      label: "High",
                      color: "bg-orange-100 text-orange-700 border-orange-200",
                    },
                    {
                      value: "urgent",
                      label: "Urgent",
                      color: "bg-red-100 text-red-700 border-red-200",
                    },
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() =>
                        handleFilterChange(
                          "priority",
                          filters.priority === priority.value
                            ? ""
                            : priority.value
                        )
                      }
                      className={`px-3 py-2 text-xs rounded-lg border transition-all duration-200 font-medium ${
                        filters.priority === priority.value
                          ? priority.color
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Due Date
                </label>
                <div className="flex items-center gap-2 p-3 border border-slate-600 bg-slate-700/30 rounded-lg hover:border-slate-500 transition-colors">
                  <FiCalendar className="w-4 h-4 text-slate-400" />
                  <select
                    className="flex-1 bg-transparent text-sm focus:outline-none text-slate-200"
                    value={filters.dueDate}
                    onChange={(e) =>
                      handleFilterChange("dueDate", e.target.value)
                    }
                  >
                    <option value="" className="bg-slate-800">
                      All dates
                    </option>
                    <option value="overdue" className="bg-slate-800">
                      Overdue
                    </option>
                    <option value="today" className="bg-slate-800">
                      Due today
                    </option>
                    <option value="week" className="bg-slate-800">
                      Due this week
                    </option>
                    <option value="month" className="bg-slate-800">
                      Due this month
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-600">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Clear filters
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={applyFilters}
                  className="min-w-[100px]"
                >
                  Apply filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchAndFilters;

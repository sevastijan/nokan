"use client";

import { FiGrid, FiCalendar } from "react-icons/fi";
import Button from "../Button/Button";
import { ViewToggleProps } from "./types";

const ViewToggle = ({ showCalendar, setShowCalendar }: ViewToggleProps) => {
  return (
    <div className="flex items-center bg-slate-700/50 rounded-lg p-1 border border-slate-600/50">
      <Button
        variant={!showCalendar ? "primary" : "ghost"}
        size="sm"
        onClick={() => setShowCalendar(false)}
        className={`flex items-center gap-2 rounded-md transition-all ${
          !showCalendar
            ? "!bg-slate-600 !text-white shadow-sm border-slate-500"
            : "!text-slate-300 hover:!text-slate-100 !bg-transparent hover:!bg-slate-600/50"
        }`}
      >
        <FiGrid className="w-4 h-4" />
        Board
      </Button>

      <Button
        variant={showCalendar ? "primary" : "ghost"}
        size="sm"
        onClick={() => setShowCalendar(true)}
        className={`flex items-center gap-2 rounded-md transition-all ${
          showCalendar
            ? "!bg-slate-600 !text-white shadow-sm border-slate-500"
            : "!text-slate-300 hover:!text-slate-100 !bg-transparent hover:!bg-slate-600/50"
        }`}
      >
        <FiCalendar className="w-4 h-4" />
        Calendar
      </Button>
    </div>
  );
};

export default ViewToggle;

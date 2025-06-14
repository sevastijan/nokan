import React from "react";
import { Board } from "@/app/types/globalTypes";

import type { BoardWithCounts } from "@/app/store/apiSlice";

interface BoardListProps {
  boards: BoardWithCounts[];
  onEdit: (boardId: string) => void;
  onDelete: (boardId: string) => void;
}

const BoardList = ({ boards, onEdit, onDelete }: BoardListProps) => {
  if (!boards || boards.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        No boards found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((b) => (
        <div
          key={b.id}
          className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 flex flex-col justify-between hover:bg-slate-700 transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-white truncate">
              {b.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Tasks: {b._count?.tasks ?? 0} | Team Members:{" "}
              {b._count?.teamMembers ?? 0}
            </p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => onEdit(b.id)}
              className="text-slate-300 hover:text-white text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(b.id)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardList;

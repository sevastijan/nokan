// src/app/components/Board/BoardList.tsx
"use client";

import { useRouter } from "next/navigation";
import { FaTasks, FaUsers, FaArrowRight } from "react-icons/fa";
import BoardDropdown from "./BoardDropdown";

interface Board {
  id: string;
  title: string;
  owner: string;
  _count?: {
    tasks: number;
    teamMembers: number;
  };
}

interface BoardListProps {
  boards: Board[];
  onEdit: (boardId: string) => void;
  onDelete: (boardId: string) => void;
}

export const BoardList = ({ boards, onEdit, onDelete }: BoardListProps) => {
  const router = useRouter();

  if (boards.length === 0) {
    return (
      <div className="text-center p-12 text-slate-400">
        You don’t have any boards yet. Create your first one!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {boards.map((b) => (
        <div
          key={b.id}
          className="group bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition cursor-pointer"
          onClick={() => router.push(`/board/${b.id}`)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{b.title}</h3>
              <p className="text-slate-400 text-sm">Owner: {b.owner}</p>
            </div>
            <BoardDropdown
              onEdit={() => onEdit(b.id)}
              onDelete={() => onDelete(b.id)}
            />
          </div>

          <div className="flex items-center justify-between text-slate-400 text-sm pt-4 border-t border-slate-700/50">
            <span className="flex items-center gap-1">
              <FaTasks /> {b._count?.tasks ?? 0} tasks
            </span>
            <span className="flex items-center gap-1">
              <FaUsers /> {b._count?.teamMembers ?? 0} members
            </span>
            <FaArrowRight className="opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardList;

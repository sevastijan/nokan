import { FaPen, FaTrash } from 'react-icons/fa';
import type { BoardWithCounts } from '@/app/types/globalTypes';

interface BoardListProps {
     boards: BoardWithCounts[];
     onEdit: (boardId: string) => void;
     onDelete: (boardId: string) => void;
}

const BoardList = ({ boards, onEdit, onDelete }: BoardListProps) => {
     if (!boards || boards.length === 0) {
          return <div className="text-slate-400 text-center py-8">No boards found. Create one to get started.</div>;
     }

     return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {boards.map((b) => (
                    <div key={b.id} className="relative bg-slate-800/60 p-4 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors group">
                         <div>
                              <h3 className="text-lg font-semibold text-white truncate">{b.title}</h3>
                              <p className="text-sm text-slate-400 mt-1">
                                   Tasks: {b._count?.tasks ?? 0} | Team: {b._count?.teamMembers ?? 0}
                              </p>
                         </div>

                         <div className="absolute top-3 right-3 flex gap-3 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => onEdit(b.id)} className="text-purple-400 hover:text-purple-200" title="Edit board">
                                   <FaPen className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDelete(b.id)} className="text-red-500 hover:text-red-300" title="Delete board">
                                   <FaTrash className="w-4 h-4" />
                              </button>
                         </div>
                    </div>
               ))}
          </div>
     );
};

export default BoardList;

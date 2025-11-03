import { FaEllipsisV, FaEdit, FaTrash, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';

interface BoardListItemProps {
     board: {
          id: string;
          title: string;
          _count?: {
               tasks?: number;
               teamMembers?: number;
          };
     };
     isMenuOpen: boolean;
     onMenuToggle: () => void;
     onEdit: (e: React.MouseEvent) => void;
     onDelete: (e: React.MouseEvent) => void;
     onBoardClick: () => void;
}

export const BoardListItem = ({ board, isMenuOpen, onMenuToggle, onEdit, onDelete, onBoardClick }: BoardListItemProps) => {
     return (
          <div
               className="relative cursor-pointer bg-slate-800/70 p-4 rounded-xl border border-slate-700 hover:bg-slate-800/90 transition group shadow-sm"
               onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.board-menu-btn') || (e.target as HTMLElement).closest('.board-menu-dropdown')) return;
                    onBoardClick();
               }}
          >
               <div className="flex items-center justify-between gap-4">
                    {/* Board Title */}
                    <div className="flex-1 min-w-0">
                         <h3 className="text-lg font-semibold text-white truncate">{board.title}</h3>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                         <div className="flex items-center gap-2">
                              <FaCalendarAlt className="w-4 h-4 text-purple-400" />
                              <span>{board._count?.tasks ?? 0} tasks</span>
                         </div>
                         <div className="flex items-center gap-2">
                              <FaUserFriends className="w-4 h-4 text-blue-400" />
                              <span>{board._count?.teamMembers ?? 0} members</span>
                         </div>
                    </div>

                    {/* Menu Button */}
                    <div className="relative z-20">
                         <button
                              className="board-menu-btn p-2 rounded-full hover:bg-slate-700 text-slate-400 transition"
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onMenuToggle();
                              }}
                              aria-label="Board actions"
                         >
                              <FaEllipsisV />
                         </button>

                         {/* Dropdown Menu */}
                         {isMenuOpen && (
                              <div className="board-menu-dropdown absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-lg z-30">
                                   <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-white rounded-t-xl"
                                        onClick={(e) => {
                                             onEdit(e);
                                        }}
                                   >
                                        <FaEdit className="w-4 h-4" /> Edit
                                   </button>
                                   <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-600/80 flex items-center gap-2 text-red-400 rounded-b-xl"
                                        onClick={(e) => {
                                             onDelete(e);
                                        }}
                                   >
                                        <FaTrash className="w-4 h-4" /> Delete
                                   </button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

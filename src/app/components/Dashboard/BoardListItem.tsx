import { MoreHorizontal, Pencil, Trash2, ClipboardList, Users } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

interface BoardListItemProps {
     board: {
          id: string;
          title: string;
          _count?: {
               tasks?: number;
               teamMembers?: number;
          };
     };
     onEdit: () => void;
     onDelete: () => void;
     onBoardClick: () => void;
}

export const BoardListItem = ({ board, onEdit, onDelete, onBoardClick }: BoardListItemProps) => {
     const taskCount = board._count?.tasks ?? 0;
     const memberCount = board._count?.teamMembers ?? 0;

     return (
          <div
               className="group relative cursor-pointer bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/90 hover:border-slate-600/50 transition-all duration-200"
               onClick={onBoardClick}
          >
               <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-medium text-white truncate flex-1 min-w-0">{board.title}</h3>

                    <div className="flex items-center gap-4 shrink-0">
                         <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1.5">
                                   <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                                   {taskCount}
                              </span>
                              <span className="flex items-center gap-1.5">
                                   <Users className="w-3.5 h-3.5 text-slate-500" />
                                   {memberCount}
                              </span>
                         </div>

                         <Menu as="div" className="relative">
                              <Menu.Button
                                   className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition cursor-pointer"
                                   onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                   aria-label="Board actions"
                              >
                                   <MoreHorizontal className="w-4.5 h-4.5" />
                              </Menu.Button>

                              <Transition
                                   enter="transition ease-out duration-100"
                                   enterFrom="opacity-0 scale-95"
                                   enterTo="opacity-100 scale-100"
                                   leave="transition ease-in duration-75"
                                   leaveFrom="opacity-100 scale-100"
                                   leaveTo="opacity-0 scale-95"
                              >
                                   <Menu.Items className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl z-30 py-1 focus:outline-none">
                                        <Menu.Item>
                                             {({ active }) => (
                                                  <button
                                                       className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                                            active ? 'bg-slate-700/50 text-white' : 'text-slate-300'
                                                       }`}
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit();
                                                       }}
                                                  >
                                                       <Pencil className="w-3.5 h-3.5" /> Edit
                                                  </button>
                                             )}
                                        </Menu.Item>
                                        <Menu.Item>
                                             {({ active }) => (
                                                  <button
                                                       className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                                            active ? 'bg-red-600/20 text-red-300' : 'text-red-400'
                                                       }`}
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete();
                                                       }}
                                                  >
                                                       <Trash2 className="w-3.5 h-3.5" /> Delete
                                                  </button>
                                             )}
                                        </Menu.Item>
                                   </Menu.Items>
                              </Transition>
                         </Menu>
                    </div>
               </div>
          </div>
     );
};

'use client';

import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Trash2, Star, GripVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BoardListItemProps {
     board: {
          id: string;
          title: string;
          _count?: {
               tasks?: number;
               teamMembers?: number;
          };
     };
     avatarUrl?: string | null;
     isFavorite?: boolean;
     sortable?: boolean;
     onToggleFavorite?: () => void;
     onEdit: () => void;
     onDelete: () => void;
     onBoardClick: () => void;
}

function getInitials(title: string): string {
     const words = title.trim().split(/\s+/);
     if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
     return title.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
     'bg-slate-700',
     'bg-slate-700/80',
     'bg-zinc-700',
     'bg-zinc-700/80',
     'bg-neutral-700',
     'bg-stone-700',
     'bg-gray-700',
     'bg-slate-600/60',
];

function getColorForId(id: string): string {
     let hash = 0;
     for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
     return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const BoardListItem = ({ board, avatarUrl, isFavorite, sortable, onToggleFavorite, onEdit, onDelete, onBoardClick }: BoardListItemProps) => {
     const { t } = useTranslation();
     const taskCount = board._count?.tasks ?? 0;
     const memberCount = board._count?.teamMembers ?? 0;

     const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
          id: board.id,
          disabled: !sortable,
     });

     const style = sortable
          ? {
                 transform: CSS.Translate.toString(transform),
                 transition,
                 opacity: isDragging ? 0.5 : 1,
                 zIndex: isDragging ? 10 : undefined,
            }
          : undefined;

     return (
          <div ref={setNodeRef} style={style}>
               <div
                    className="group relative flex items-center gap-3 cursor-pointer py-3 transition-colors duration-100"
                    onClick={onBoardClick}
               >
                    {/* Avatar */}
                    <div className="shrink-0">
                         {avatarUrl ? (
                              <img
                                   src={avatarUrl}
                                   alt={board.title}
                                   className="w-9 h-9 rounded-lg object-cover"
                              />
                         ) : (
                              <div className={`w-9 h-9 rounded-lg ${getColorForId(board.id)} flex items-center justify-center border border-slate-600/30`}>
                                   <span className="text-[11px] font-semibold text-slate-300">{getInitials(board.title)}</span>
                              </div>
                         )}
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                         <h3 className="text-sm font-medium text-slate-100 truncate leading-tight group-hover:text-white">{board.title}</h3>
                         <p className="text-[12px] text-slate-500 mt-0.5">
                              {taskCount} {taskCount === 1 ? 'zadanie' : taskCount < 5 ? 'zadania' : 'zadań'}
                              {memberCount > 0 && <span className="text-slate-600"> · </span>}
                              {memberCount > 0 && <span>{memberCount} {memberCount === 1 ? 'osoba' : memberCount < 5 ? 'osoby' : 'osób'}</span>}
                         </p>
                    </div>

                    {/* Actions - only on hover */}
                    <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onToggleFavorite?.();
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-700/60 transition cursor-pointer"
                              aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                         >
                              <Star
                                   className={`w-3.5 h-3.5 transition ${
                                        isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                   }`}
                              />
                         </button>

                         <Menu as="div" className="relative">
                              <Menu.Button
                                   className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 transition cursor-pointer"
                                   onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                   aria-label={t('dashboard.boardActions')}
                              >
                                   <MoreHorizontal className="w-3.5 h-3.5" />
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
                                                       <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
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
                                                       <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                                                  </button>
                                             )}
                                        </Menu.Item>
                                   </Menu.Items>
                              </Transition>
                         </Menu>

                         {/* Drag handle */}
                         {sortable && (
                              <div
                                   ref={setActivatorNodeRef}
                                   {...attributes}
                                   {...listeners}
                                   className="p-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-slate-700/60 transition touch-none"
                              >
                                   <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                              </div>
                         )}
                    </div>
               </div>

               {/* Separator */}
               <div className="border-b border-slate-800/60" />
          </div>
     );
};

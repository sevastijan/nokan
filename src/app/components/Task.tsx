'use client';

import { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent, MouseEvent } from 'react';
import { FiMoreVertical, FiFlag, FiCalendar, FiUserPlus, FiCheckSquare, FiCornerDownRight, FiCheck, FiTrash2, FiEdit3 } from 'react-icons/fi';
import { FaLayerGroup } from 'react-icons/fa';
import Avatar from './Avatar/Avatar';
import { Task as TaskType } from '@/app/types/globalTypes';
import { getPriorityStyleConfig, truncateText } from '@/app/utils/helpers';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';

interface TaskProps {
     task: TaskType;
     columnId: string;
     onRemoveTask: (columnId: string, taskId: string) => void;
     onOpenTaskDetail: (taskId: string) => void;
     priorities?: Array<{ id: string; label: string; color: string }>;
     taskIndex: number;
     onFilterByAssignee?: (assigneeId: string) => void;
     activeFilterAssigneeId?: string | null;
}

const Task = ({ task, columnId, onRemoveTask, onOpenTaskDetail, priorities = [], onFilterByAssignee, activeFilterAssigneeId }: TaskProps) => {
     const [menuOpen, setMenuOpen] = useState(false);
     const [focusedIndex, setFocusedIndex] = useState(0);
     const [isHovered, setIsHovered] = useState(false);

     const triggerRef = useRef<HTMLButtonElement>(null);
     const menuRef = useRef<HTMLDivElement>(null);

     const getPlainTextFromHtml = useCallback((html: string | undefined): string => {
          if (!html) return '';
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return doc.body.textContent || '';
     }, []);

     const priorityConfig = useMemo(() => {
          if (!task.priority) return null;

          const customPriority = priorities.find((p) => p.id === task.priority);
          if (customPriority) {
               return {
                    label: customPriority.label,
                    dotColor: customPriority.color,
                    cfg: { bgColor: 'bg-slate-700/80', textColor: 'text-white' },
               };
          }

          const cfg = getPriorityStyleConfig(task.priority);
          if (cfg) {
               return {
                    label: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
                    dotColor: cfg.dotColor,
                    cfg,
               };
          }

          return null;
     }, [task.priority, priorities]);

     const assignees = task.collaborators || [];
     const hasAssignees = assignees.length > 0;
     const isStory = task.type === 'story';
     const isSubtask = Boolean(task.parent_id);
     const isCompleted = task.completed === true;
     const isFilteredByAnyAssignee = assignees.some((a) => a.id === activeFilterAssigneeId);

     const openMenu = useCallback(() => {
          setMenuOpen(true);
          setFocusedIndex(0);
     }, []);

     const closeMenu = useCallback(() => {
          setMenuOpen(false);
          setFocusedIndex(0);
     }, []);

     const menuItems = useMemo(
          () => [
               {
                    label: 'Edit',
                    icon: FiEdit3,
                    action: () => {
                         onOpenTaskDetail(task.id);
                         closeMenu();
                    },
               },
               {
                    label: 'Delete',
                    icon: FiTrash2,
                    destructive: true,
                    action: () => {
                         closeMenu();
                         setTimeout(() => onRemoveTask(columnId, task.id), 150);
                    },
               },
          ],
          [closeMenu, columnId, onOpenTaskDetail, onRemoveTask, task.id],
     );

     const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
     };

     const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
          if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
               e.preventDefault();
               openMenu();
          }
     };

     const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'ArrowDown') {
               e.preventDefault();
               setFocusedIndex((prev) => (prev + 1) % menuItems.length);
          } else if (e.key === 'ArrowUp') {
               e.preventDefault();
               setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
          } else if (e.key === 'Escape') {
               e.preventDefault();
               closeMenu();
          } else if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               menuItems[focusedIndex].action();
          }
     };

     useEffect(() => {
          if (menuOpen) menuRef.current?.focus();
     }, [menuOpen]);

     useEffect(() => {
          if (!menuOpen) return;
          const buttons = menuRef.current?.querySelectorAll("button[role='menuitem']");
          (buttons?.[focusedIndex] as HTMLElement | undefined)?.focus();
     }, [focusedIndex, menuOpen]);

     useOutsideClick([menuRef, triggerRef], closeMenu);

     const handleCardClick = () => {
          if (!menuOpen) onOpenTaskDetail(task.id);
     };

     const plainDescription = useMemo(() => getPlainTextFromHtml(task.description), [task.description, getPlainTextFromHtml]);
     const hasTitle = Boolean(task.title?.trim());
     const hasDesc = Boolean(plainDescription.trim());
     const showMeta = Boolean(priorityConfig || task.due_date || hasAssignees);
     const isEmpty = !hasTitle && !hasDesc && !showMeta;

     const getGradientOverlay = () => {
          if (!priorityConfig) return 'from-slate-800/0 to-transparent';
          return `from-[${priorityConfig.dotColor}]/5 to-transparent`;
     };

     return (
          <div
               onClick={handleCardClick}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}
               className={`
        relative cursor-pointer group transition-all duration-300 ease-out
        bg-linear-to-br from-slate-800/95 to-slate-850/95 backdrop-blur-sm
        border border-slate-700/50 rounded-xl overflow-hidden
        hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30
        hover:bg-linear-to-br hover:from-slate-750/95 hover:to-slate-800/95
        ${isEmpty ? 'min-h-20' : 'min-h-30'}
        ${isCompleted ? 'opacity-70' : ''}
        ${isHovered ? 'ring-1 ring-blue-500/20' : ''}
      `}
               style={{
                    borderLeftWidth: '3px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: priorityConfig?.dotColor || '#475569',
               }}
          >
               <div className={`absolute inset-0 bg-linear-to-br ${getGradientOverlay()} opacity-30 pointer-events-none`} />

               <button
                    ref={triggerRef}
                    onClick={handleTriggerClick}
                    onKeyDown={handleTriggerKeyDown}
                    aria-label="Task options"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    className={`
          absolute top-3 right-3 p-2 rounded-lg z-10 transition-all duration-200
          ${isHovered || menuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          hover:bg-slate-700/70 focus:bg-slate-700/70 active:scale-95 backdrop-blur-sm
        `}
               >
                    <FiMoreVertical size={18} className="text-white/80" />
               </button>

               {isEmpty ? (
                    <div className="flex h-20 items-center justify-center px-4 relative z-1">
                         <span className="text-white/30 italic text-sm font-medium">Untitled task</span>
                    </div>
               ) : (
                    <div className="p-4 flex flex-col gap-3 relative z-1">
                         <div className="flex items-start gap-2.5 pr-8">
                              {isSubtask ? (
                                   <FiCornerDownRight className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              ) : isStory ? (
                                   <FaLayerGroup className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              ) : (
                                   <FiCheckSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isCompleted ? 'text-green-400' : 'text-blue-400'}`} />
                              )}

                              <h4
                                   className={`
                font-semibold text-white text-[15px] leading-snug break-word
                ${isCompleted ? 'line-through opacity-70' : ''}
              `}
                              >
                                   {hasTitle ? task.title : <span className="text-white/40 italic font-normal">Untitled</span>}
                              </h4>
                         </div>

                         {hasDesc && <p className={`text-white/60 text-sm leading-relaxed line-clamp-2 pl-6 ${isCompleted ? 'opacity-70' : ''}`}>{truncateText(plainDescription, 100)}</p>}

                         {showMeta && (
                              <div className="flex items-center justify-between mt-2 gap-3">
                                   <div className="flex items-center gap-2 text-xs flex-wrap">
                                        {priorityConfig && (
                                             <span
                                                  className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium
                      ${priorityConfig.cfg.bgColor} ${priorityConfig.cfg.textColor}
                      backdrop-blur-sm shadow-sm transition-all duration-200
                      hover:shadow-md hover:brightness-110 ${isCompleted ? 'opacity-60' : ''}
                    `}
                                             >
                                                  <FiFlag size={12} style={{ color: priorityConfig.dotColor }} />
                                                  <span className="text-xs">{priorityConfig.label}</span>
                                             </span>
                                        )}

                                        {isCompleted && (
                                             <div className="bg-green-500/20 border border-green-500/40 rounded-lg px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-sm">
                                                  <FiCheck className="w-3 h-3 text-green-400" />
                                                  <span className="text-xs text-green-400 font-medium">Done</span>
                                             </div>
                                        )}

                                        {task.due_date && (
                                             <span className={`flex items-center gap-1.5 text-white/50 bg-slate-700/40 px-2.5 py-1 rounded-lg backdrop-blur-sm ${isCompleted ? 'opacity-60' : ''}`}>
                                                  <FiCalendar size={12} />
                                                  <span className="text-xs">{new Date(task.due_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
                                             </span>
                                        )}
                                   </div>

                                   {hasAssignees ? (
                                        <div className="flex items-center -space-x-2">
                                             {assignees.slice(0, 3).map((assignee, idx) => (
                                                  <button
                                                       key={assignee.id}
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            onFilterByAssignee?.(assignee.id);
                                                       }}
                                                       style={{ zIndex: 3 - idx }}
                                                       title={`Filtruj taski: ${assignee.custom_name || assignee.name || assignee.email || 'User'}`}
                                                       className="transition-all duration-200 hover:-translate-y-0.5 rounded-full focus:outline-none"
                                                  >
                                                       <Avatar
                                                            src={assignee.custom_image || assignee.image || ''}
                                                            alt={assignee.custom_name || assignee.name || assignee.email || 'User'}
                                                            size={32}
                                                            className={`
                          shadow-lg cursor-pointer transition-all duration-200
                          ${isCompleted ? 'opacity-60' : ''}
                          ${assignee.id === activeFilterAssigneeId ? 'border-[3px] border-blue-500 ring-2 ring-blue-400/30 scale-110' : 'border-2 border-slate-800'}
                        `}
                                                       />
                                                  </button>
                                             ))}

                                             {assignees.length > 3 && (
                                                  <button
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (assignees[0]) onFilterByAssignee?.(assignees[0].id);
                                                       }}
                                                       className={`
                        w-8 h-8 rounded-full bg-slate-700/80 backdrop-blur-sm
                        flex items-center justify-center
                        text-xs text-white/80 font-semibold shadow-lg cursor-pointer
                        transition-all duration-200 hover:-translate-y-0.5
                        focus:outline-none
                        ${isCompleted ? 'opacity-60' : ''}
                        ${isFilteredByAnyAssignee ? 'border-[3px] border-blue-500 ring-2 ring-blue-400/30 scale-110' : 'border-2 border-slate-800'}
                      `}
                                                       title="Filtruj taski przypisanych osób"
                                                  >
                                                       +{assignees.length - 3}
                                                  </button>
                                             )}
                                        </div>
                                   ) : (
                                        <button
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  onOpenTaskDetail(task.id);
                                             }}
                                             className="w-9 h-9 rounded-full border-2 border-dashed border-white/20 hover:border-white/50 hover:bg-white/5 transition-all duration-200 flex items-center justify-center active:scale-95"
                                             aria-label="Assign user"
                                        >
                                             <FiUserPlus size={16} className="text-white/40 hover:text-white/70 transition-colors" />
                                        </button>
                                   )}
                              </div>
                         )}
                    </div>
               )}

               {menuOpen && (
                    <>
                         <div className="fixed inset-0 z-40" onClick={closeMenu} />
                         <div
                              ref={menuRef}
                              role="menu"
                              tabIndex={-1}
                              onKeyDown={handleMenuKeyDown}
                              className="absolute top-12 right-3 z-50 bg-slate-800/95 backdrop-blur-xl text-slate-100 rounded-xl shadow-2xl shadow-slate-900/50 border border-slate-600/50 overflow-hidden min-w-40 animate-in fade-in slide-in-from-top-2 duration-200"
                         >
                              {menuItems.map((item, idx) => {
                                   const Icon = item.icon;
                                   return (
                                        <button
                                             key={idx}
                                             role="menuitem"
                                             tabIndex={-1}
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  item.action();
                                             }}
                                             className={`
                    w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3
                    hover:bg-slate-700/70 focus:bg-slate-700/70 focus:outline-none transition-all duration-150
                    ${item.destructive ? 'text-red-400 hover:text-red-300' : 'text-white/80 hover:text-white'}
                    ${idx !== menuItems.length - 1 ? 'border-b border-slate-700/50' : ''}
                  `}
                                        >
                                             <Icon size={16} />
                                             {item.label}
                                        </button>
                                   );
                              })}
                         </div>
                    </>
               )}
          </div>
     );
};

export default Task;

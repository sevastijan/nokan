'use client';

import { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent, MouseEvent } from 'react';
import { FiMoreVertical, FiFlag, FiCalendar, FiUserPlus, FiCheckSquare, FiCornerDownRight } from 'react-icons/fi';
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
}

const Task = ({ task, columnId, onRemoveTask, onOpenTaskDetail, priorities = [] }: TaskProps) => {
     const [menuOpen, setMenuOpen] = useState(false);
     const [focusedIndex, setFocusedIndex] = useState(0);

     const triggerRef = useRef<HTMLButtonElement>(null);
     const menuRef = useRef<HTMLDivElement>(null);

     // Parse HTML description to plain text
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
                    cfg: {
                         bgColor: 'bg-slate-700',
                         textColor: 'text-white',
                    },
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
                    label: 'View / Edit',
                    action: () => {
                         onOpenTaskDetail(task.id);
                         closeMenu();
                    },
               },
               {
                    label: 'Delete',
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
          if (menuOpen) closeMenu();
          else openMenu();
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
          if (menuOpen) {
               menuRef.current?.focus();
          }
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

     const leftBorderStyle = priorityConfig ? { borderLeftColor: priorityConfig.dotColor } : { borderLeftColor: '#475569' };

     const plainDescription = useMemo(() => getPlainTextFromHtml(task.description), [task.description, getPlainTextFromHtml]);
     const hasTitle = Boolean(task.title?.trim());
     const hasDesc = Boolean(plainDescription.trim());
     const showMeta = Boolean(priorityConfig || task.due_date || hasAssignees);
     const isEmpty = !hasTitle && !hasDesc && !showMeta;

     return (
          <div
               onClick={handleCardClick}
               className={`
        relative cursor-pointer group transition-colors duration-200
        bg-slate-800 border border-slate-700 rounded-lg overflow-hidden
        hover:bg-slate-750 hover:border-slate-600
        ${isEmpty ? 'min-h-16' : 'min-h-24'}
      `}
               style={{
                    borderLeftWidth: '4px',
                    borderLeftStyle: 'solid',
                    ...leftBorderStyle,
               }}
          >
               <button
                    ref={triggerRef}
                    onClick={handleTriggerClick}
                    onKeyDown={handleTriggerKeyDown}
                    aria-label="Task options"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    className="absolute top-2.5 right-2.5 p-2 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white/20 focus:bg-white/20 transition-all z-10"
               >
                    <FiMoreVertical size={18} className="text-white/70" />
               </button>

               {isEmpty ? (
                    <div className="flex h-16 items-center justify-center px-4">
                         <span className="text-white/40 italic text-sm">Untitled task</span>
                    </div>
               ) : (
                    <div className="p-4 flex flex-col gap-2">
                         <h4 className="font-semibold text-white text-base leading-tight truncate flex items-center gap-2">
                              {isSubtask ? (
                                   <FiCornerDownRight className="w-4 h-4 text-orange-400 shrink-0" />
                              ) : isStory ? (
                                   <FaLayerGroup className="w-4 h-4 text-purple-400 shrink-0" />
                              ) : (
                                   <FiCheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                              )}
                              {hasTitle ? task.title : <span className="text-white/40 italic">Untitled</span>}
                         </h4>

                         {hasDesc && <p className="text-white/70 text-sm line-clamp-2">{truncateText(plainDescription, 80)}</p>}

                         {showMeta && (
                              <div className="flex items-center justify-between mt-3">
                                   <div className="flex items-center gap-3 text-xs">
                                        {priorityConfig && (
                                             <span
                                                  className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium
                      ${priorityConfig.cfg.bgColor} ${priorityConfig.cfg.textColor}
                    `}
                                             >
                                                  <FiFlag size={11} style={{ color: priorityConfig.dotColor }} />
                                                  {priorityConfig.label}
                                             </span>
                                        )}
                                        {task.due_date && (
                                             <span className="flex items-center gap-1 text-white/60">
                                                  <FiCalendar size={11} />
                                                  {new Date(task.due_date).toLocaleDateString('pl-PL', {
                                                       day: 'numeric',
                                                       month: 'short',
                                                  })}
                                             </span>
                                        )}
                                   </div>

                                   {hasAssignees ? (
                                        <div className="flex items-center -space-x-2">
                                             {assignees.slice(0, 3).map((assignee, idx) => (
                                                  <div key={assignee.id} style={{ zIndex: 3 - idx }} title={assignee.custom_name || assignee.name || assignee.email || 'User'}>
                                                       <Avatar
                                                            src={assignee.custom_image || assignee.image || ''}
                                                            alt={assignee.custom_name || assignee.name || 'User'}
                                                            size={28}
                                                            className="border-2 border-slate-800 ring-1 ring-white/10"
                                                       />
                                                  </div>
                                             ))}
                                             {assignees.length > 3 && (
                                                  <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white/70 font-medium">
                                                       +{assignees.length - 3}
                                                  </div>
                                             )}
                                        </div>
                                   ) : (
                                        <button
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  onOpenTaskDetail(task.id);
                                             }}
                                             className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 hover:border-white/60 transition-colors flex items-center justify-center"
                                             aria-label="Assign user"
                                        >
                                             <FiUserPlus size={15} className="text-white/50" />
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
                              className="absolute top-10 right-3 z-50 bg-slate-800 text-slate-100 rounded-md shadow-xl border border-slate-600/50 overflow-hidden min-w-40"
                         >
                              {menuItems.map((item, idx) => (
                                   <button
                                        key={idx}
                                        role="menuitem"
                                        tabIndex={-1}
                                        onClick={(e) => {
                                             e.stopPropagation();
                                             item.action();
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/70 focus:bg-slate-700/70 focus:outline-none transition-colors"
                                   >
                                        {item.label}
                                   </button>
                              ))}
                         </div>
                    </>
               )}
          </div>
     );
};

export default Task;

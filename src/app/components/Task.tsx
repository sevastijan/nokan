'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect, KeyboardEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMoreVertical, FiFlag, FiCalendar, FiUserPlus, FiCornerDownRight, FiCheck, FiTrash2, FiEdit3, FiCircle, FiBookOpen, FiMessageCircle, FiRepeat } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
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

const PRIORITY_LABELS: Record<string, string> = { Low: 'Niski', Normal: 'Normalny', Medium: 'Średni', High: 'Wysoki', Urgent: 'Pilny' };
const TYPE_LABELS: Record<string, string> = { task: 'Zadanie', story: 'Story', bug: 'Błąd', subtask: 'Subtask' };

const Task = ({ task, columnId, onRemoveTask, onOpenTaskDetail, priorities = [], onFilterByAssignee, activeFilterAssigneeId }: TaskProps) => {
     const { t } = useTranslation();
     const [menuOpen, setMenuOpen] = useState(false);
     const [focusedIndex, setFocusedIndex] = useState(0);
     const [isHovered, setIsHovered] = useState(false);

     const triggerRef = useRef<HTMLButtonElement>(null);
     const menuRef = useRef<HTMLDivElement>(null);
     const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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
                    label: PRIORITY_LABELS[customPriority.label] || customPriority.label,
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
     const isBug = task.type === 'bug';
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
                    label: 'Edytuj',
                    icon: FiEdit3,
                    action: () => {
                         onOpenTaskDetail(task.id);
                         closeMenu();
                    },
               },
               {
                    label: 'Usuń',
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

     useLayoutEffect(() => {
          if (menuOpen && triggerRef.current) {
               const rect = triggerRef.current.getBoundingClientRect();
               setMenuPos({
                    top: rect.bottom + 4,
                    left: rect.right - 144, // min-w-36 = 144px, align right edge
               });
          }
     }, [menuOpen]);

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

     return (
          <div
               onClick={handleCardClick}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}
               className={`
                    relative cursor-pointer group transition-all duration-200
                    ${isSubtask
                         ? 'bg-slate-800/60 hover:bg-slate-750/70 border border-dashed border-slate-600/60 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-900/10'
                         : 'bg-slate-800/90 hover:bg-slate-750/95 border border-slate-700/60 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20'
                    }
                    rounded-lg overflow-hidden
                    ${isEmpty ? 'min-h-16' : ''}
                    ${isCompleted ? 'opacity-60' : ''}
               `}
          >

               <button
                    ref={triggerRef}
                    onClick={handleTriggerClick}
                    onKeyDown={handleTriggerKeyDown}
                    aria-label="Opcje zadania"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    className={`
                         absolute top-2.5 right-2.5 p-1.5 rounded-md z-10 transition-all duration-150
                         ${isHovered || menuOpen ? 'opacity-100' : 'opacity-0'}
                         hover:bg-slate-700 focus:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500
                    `}
               >
                    <FiMoreVertical size={16} className="text-slate-400" />
               </button>

               {isEmpty ? (
                    <div className="flex h-14 items-center justify-center px-4">
                         <span className="text-slate-500 italic text-sm">Zadanie bez tytułu</span>
                    </div>
               ) : (
                    <div className="p-3 flex flex-col gap-2">
                         {/* Type + Priority pills */}
                         <div className="flex items-center gap-1.5 flex-wrap">
                              {isSubtask ? (
                                   <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-orange-300 bg-orange-500/15">
                                        <FiCornerDownRight className="w-2.5 h-2.5" /> {TYPE_LABELS.subtask}
                                   </span>
                              ) : isBug ? (
                                   <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-red-300 bg-red-500/15">
                                        <FaFire className="w-2.5 h-2.5" /> {TYPE_LABELS.bug}
                                   </span>
                              ) : isStory ? (
                                   <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-brand-300 bg-brand-500/15">
                                        <FiBookOpen className="w-2.5 h-2.5" /> {TYPE_LABELS.story}
                                   </span>
                              ) : (
                                   <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-slate-400 bg-slate-700/50">
                                        <FiCircle className="w-2.5 h-2.5" /> {TYPE_LABELS.task}
                                   </span>
                              )}
                              {priorityConfig && (
                                   <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                        style={{ color: priorityConfig.dotColor, backgroundColor: `${priorityConfig.dotColor}18` }}
                                   >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityConfig.dotColor }} />
                                        {priorityConfig.label}
                                   </span>
                              )}
                         </div>

                         {/* Title */}
                         <div className="flex items-start gap-1.5 pr-6">
                              {task.is_recurring && <FiRepeat className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isCompleted ? 'text-slate-400' : 'text-brand-400'}`} />}
                              <h4 className={`font-medium text-sm leading-snug ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                   {hasTitle ? task.title : <span className="text-slate-500 italic font-normal">Bez tytułu</span>}
                              </h4>
                         </div>

                         {/* Bottom row: due date, comments, assignees */}
                         <div className="flex items-center justify-between gap-2 mt-0.5">
                              <div className="flex items-center gap-2">
                                   {(task.end_date || task.due_date) && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                             <FiCalendar size={10} />
                                             {new Date(task.end_date || task.due_date!).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                        </span>
                                   )}
                                   {(task.comment_count ?? 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                             <FiMessageCircle size={12} />
                                             {task.comment_count}
                                        </span>
                                   )}
                              </div>
                              {hasAssignees ? (
                                        <div className="flex items-center -space-x-1.5 shrink-0">
                                             {assignees.slice(0, 3).map((assignee, idx) => (
                                                  <button
                                                       key={assignee.id}
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            onFilterByAssignee?.(assignee.id);
                                                       }}
                                                       style={{ zIndex: 3 - idx }}
                                                       title={`Filtruj: ${assignee.custom_name || assignee.name || assignee.email || 'User'}`}
                                                       className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                  >
                                                       <Avatar
                                                            src={assignee.custom_image || assignee.image || ''}
                                                            alt={assignee.custom_name || assignee.name || assignee.email || 'User'}
                                                            size={24}
                                                            className={`
                                                                 transition-all duration-150
                                                                 ${assignee.id === activeFilterAssigneeId ? 'ring-2 ring-brand-500' : 'border border-slate-700'}
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
                                                            w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center
                                                            text-[10px] text-slate-300 font-medium
                                                            focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
                                                            ${isFilteredByAnyAssignee ? 'ring-2 ring-brand-500' : 'border border-slate-600'}
                                                       `}
                                                       title="Filtruj przypisanych"
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
                                             className="w-6 h-6 rounded-full border border-dashed border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 transition-colors flex items-center justify-center"
                                             aria-label="Przypisz użytkownika"
                                        >
                                             <FiUserPlus size={12} className="text-slate-500" />
                                        </button>
                                   )}
                         </div>
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
                              className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/30 overflow-hidden min-w-36 py-1"
                              style={{ top: menuPos.top, left: menuPos.left }}
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
                                                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                                                  hover:bg-slate-700 focus:bg-slate-700 focus:outline-none transition-colors
                                                  ${item.destructive ? 'text-red-400' : 'text-slate-300'}
                                             `}
                                        >
                                             <Icon size={14} />
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

export default React.memo(Task);

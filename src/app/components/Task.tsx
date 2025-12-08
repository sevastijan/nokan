'use client';

import { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMoreVertical, FiFlag, FiCalendar, FiUserPlus } from 'react-icons/fi';
import Avatar from './Avatar/Avatar';
import { Task as TaskType, User } from '@/app/types/globalTypes';
import { getPriorityStyleConfig, truncateText, useUserAvatar } from '@/app/utils/helpers';
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

     const priorityConfig = useMemo(() => {
          if (!task.priority) return null;
          const found = priorities.find((p) => p.id === task.priority);
          const cfg = getPriorityStyleConfig(task.priority);
          return {
               label: found?.label || task.priority,
               dotColor: found?.color || cfg.dotColor,
               cfg,
          };
     }, [task.priority, priorities]);

     const assignee = (task.assignee as User) || null;
     const avatarUrl = useUserAvatar(assignee);

     const openMenu = useCallback(() => {
          setMenuOpen(true);
          setFocusedIndex(0);
     }, []);

     const closeMenu = useCallback(() => {
          setMenuOpen(false);
          setFocusedIndex(0);
          triggerRef.current?.focus();
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

     const leftBorderStyle = priorityConfig ? { borderLeftColor: priorityConfig.dotColor } : { borderLeftColor: 'transparent' };

     const hasTitle = Boolean(task.title?.trim());
     const hasDesc = Boolean(task.description?.trim());
     const showMeta = Boolean(priorityConfig || task.due_date || assignee);
     const isEmpty = !hasTitle && !hasDesc && !showMeta;

     return (
          <motion.div
               layout
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.15 }}
               onClick={handleCardClick}
               className={`
        relative cursor-pointer group transition-all duration-200
        bg-white/5 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden
        hover:bg-white/8 hover:shadow-xl
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
                         <h4 className="font-semibold text-white text-base leading-tight truncate">{hasTitle ? task.title : <span className="text-white/40 italic">Untitled</span>}</h4>

                         {hasDesc && <p className="text-white/70 text-sm line-clamp-2">{truncateText(task.description!, 80)}</p>}

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

                                   {assignee && avatarUrl ? (
                                        <Avatar src={avatarUrl} alt={assignee.name} size={30} className="border-2 border-white/10" />
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

               <AnimatePresence>
                    {menuOpen && (
                         <>
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={closeMenu} />
                              <motion.div
                                   ref={menuRef}
                                   role="menu"
                                   tabIndex={-1}
                                   onKeyDown={handleMenuKeyDown}
                                   initial={{ opacity: 0, scale: 0.92, y: -8 }}
                                   animate={{ opacity: 1, scale: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.92, y: -8 }}
                                   transition={{ duration: 0.12 }}
                                   className="absolute top-10 right-3 z-50 bg-white text-gray-900 rounded-md shadow-xl border border-gray-200 overflow-hidden min-w-40"
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
                                             className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                                        >
                                             {item.label}
                                        </button>
                                   ))}
                              </motion.div>
                         </>
                    )}
               </AnimatePresence>
          </motion.div>
     );
};

export default Task;

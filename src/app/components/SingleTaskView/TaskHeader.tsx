'use client';

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiLink2, FiX, FiSave, FiCheckSquare, FiCornerDownRight } from 'react-icons/fi';
import { FaLayerGroup, FaFire } from 'react-icons/fa';
import TaskCompletionToggle from './TaskCompletionToggle';
import { TaskType } from '@/app/types/globalTypes';

interface TaskHeaderProps {
     isNewTask: boolean;
     taskId?: string;
     boardId?: string;
     title: string;
     onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
     onTitleKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
     hasUnsavedChanges: boolean;
     saving: boolean;
     onCopyLink: () => void;
     onClose: () => void;
     titleInputRef: RefObject<HTMLInputElement | null>;
     completed?: boolean;
     onCompletionToggle?: (completed: boolean) => void;
     completionDisabled?: boolean;
     completionDisabledTooltip?: string;
     taskType?: TaskType;
     onTypeChange?: (type: TaskType) => void;
     canChangeType?: boolean;
     isSubtask?: boolean;
}

import { useState, useRef, useEffect } from 'react';

const TypeIcon = ({ type }: { type: string }) => {
     switch (type) {
          case 'story': return <FaLayerGroup className="w-3 h-3 text-brand-400" />;
          case 'bug': return <FaFire className="w-3 h-3 text-red-400" />;
          case 'subtask': return <FiCornerDownRight className="w-3 h-3 text-orange-400" />;
          default: return <FiCheckSquare className="w-3 h-3 text-slate-400" />;
     }
};

const TYPE_OPTIONS: { value: TaskType; label: string; icon: typeof FiCheckSquare }[] = [
     { value: 'task', label: 'Task', icon: FiCheckSquare },
     { value: 'story', label: 'Story', icon: FaLayerGroup as unknown as typeof FiCheckSquare },
     { value: 'bug', label: 'Bug', icon: FaFire as unknown as typeof FiCheckSquare },
];

const TypeDropdown = ({ type, onChange, disabled }: { type: TaskType; onChange: (t: TaskType) => void; disabled: boolean }) => {
     const [open, setOpen] = useState(false);
     const ref = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (!open) return;
          const handleClick = (e: MouseEvent) => {
               if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
          };
          const handleKey = (e: KeyboardEvent) => {
               if (e.key === 'Escape') setOpen(false);
          };
          const timer = setTimeout(() => {
               document.addEventListener('mousedown', handleClick, true);
               document.addEventListener('keydown', handleKey);
          }, 10);
          return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClick, true); document.removeEventListener('keydown', handleKey); };
     }, [open]);

     const current = TYPE_OPTIONS.find((o) => o.value === type) || TYPE_OPTIONS[0];

     return (
          <div className="relative" ref={ref}>
               <button
                    onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen((p) => !p); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 transition ${disabled ? 'opacity-50' : 'hover:bg-slate-600/30 cursor-pointer'}`}
               >
                    <TypeIcon type={type} />
                    {current.label}
               </button>
               {open && (
                    <div className="absolute left-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[100] py-1 min-w-[120px]">
                         {TYPE_OPTIONS.map((opt) => (
                              <button
                                   key={opt.value}
                                   onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                                   className={`w-full px-3 py-2 flex items-center gap-2 text-xs transition-colors ${
                                        opt.value === type ? 'bg-slate-700/60 text-white' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                                   }`}
                              >
                                   <TypeIcon type={opt.value} />
                                   {opt.label}
                              </button>
                         ))}
                    </div>
               )}
          </div>
     );
};

const TaskHeader = ({
     isNewTask,
     taskId,
     boardId,
     title,
     onTitleChange,
     onTitleKeyDown,
     hasUnsavedChanges,
     saving,
     onCopyLink,
     onClose,
     titleInputRef,
     completed,
     onCompletionToggle,
     completionDisabled,
     completionDisabledTooltip,
     taskType,
     onTypeChange,
     canChangeType = true,
     isSubtask,
}: TaskHeaderProps) => {
     const { t } = useTranslation();
     return (
          <div className="relative">

               <div className="relative px-4 py-3 md:px-6 md:py-4 border-b border-slate-700/50">
                    {isNewTask ? (
                         /* New task: title + close on same line */
                         <div className="flex items-center gap-3">
                              <input
                                   ref={titleInputRef}
                                   type="text"
                                   className="flex-1 min-w-0 bg-transparent text-lg md:text-xl font-semibold text-white placeholder-slate-600 focus:outline-none"
                                   placeholder={t('task.titlePlaceholder')}
                                   value={title}
                                   onChange={onTitleChange}
                                   onKeyDown={onTitleKeyDown}
                              />
                              <button
                                   onClick={onClose}
                                   className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition shrink-0"
                                   title={t('common.close')}
                              >
                                   <FiX className="w-5 h-5" />
                              </button>
                         </div>
                    ) : (
                    <>
                    {/* Top row: Badge + Actions */}
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                         <div className="flex items-center gap-2">
                              {isNewTask ? null : (
                                   <div className="inline-flex items-center bg-slate-700/60 backdrop-blur-sm rounded-lg border border-slate-600/50">
                                        {/* Type selector */}
                                        {taskType && !isSubtask && onTypeChange ? (
                                             <TypeDropdown type={taskType} onChange={onTypeChange} disabled={!canChangeType} />
                                        ) : taskType ? (
                                             <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300">
                                                  <TypeIcon type={isSubtask ? 'subtask' : taskType} />
                                                  {isSubtask ? t('taskMeta.subtask') : taskType === 'story' ? 'Story' : taskType === 'bug' ? 'Bug' : 'Task'}
                                             </span>
                                        ) : null}

                                        {/* Separator */}
                                        {taskId && <div className="w-px h-4 bg-slate-600/50" />}

                                        {/* Task ID */}
                                        {taskId && (
                                             <span className="px-2.5 py-1.5 text-xs font-mono text-slate-400">
                                                  #{taskId.slice(-6).toUpperCase()}
                                             </span>
                                        )}
                                   </div>
                              )}

                              {/* Unsaved changes indicator */}
                              {hasUnsavedChanges && !saving && !isNewTask && (
                                   <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1.5 md:gap-2 bg-amber-500/10 border border-amber-500/30 px-2 py-1 md:px-3 md:py-1.5 rounded-lg"
                                   >
                                        <FiSave className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="hidden sm:inline text-xs text-amber-400 font-medium">{t('task.unsavedChanges')}</span>
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                                   </motion.div>
                              )}

                              {saving && (
                                   <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 text-slate-400"
                                   >
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-xs">{t('task.saving')}</span>
                                   </motion.div>
                              )}
                         </div>

                         <div className="flex items-center gap-1">
                              {!isNewTask && taskId && boardId && (
                                   <button
                                        onClick={onCopyLink}
                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                                        title={t('task.copyLink')}
                                   >
                                        <FiLink2 className="w-4 h-4" />
                                   </button>
                              )}
                              <button
                                   onClick={onClose}
                                   className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                                   title={t('common.close')}
                              >
                                   <FiX className="w-5 h-5" />
                              </button>
                         </div>
                    </div>

                    {/* Title input */}
                    <div className="flex items-center">
                         <input
                              ref={titleInputRef}
                              type="text"
                              className="flex-1 min-w-0 bg-transparent text-lg md:text-xl font-semibold text-white placeholder-slate-600 focus:outline-none transition-colors"
                              placeholder={t('task.titlePlaceholder')}
                              value={title}
                              onChange={onTitleChange}
                              onKeyDown={onTitleKeyDown}
                         />
                    </div>
                    </>
                    )}
               </div>
          </div>
     );
};

export default TaskHeader;

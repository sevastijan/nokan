'use client';

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiLink2, FiX, FiSave } from 'react-icons/fi';
import TaskCompletionToggle from './TaskCompletionToggle';

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
}

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
}: TaskHeaderProps) => {
     const { t } = useTranslation();
     return (
          <div className="relative">
               {/* Gradient header background */}
               <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800/95" />
               <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />

               <div className="relative px-6 py-5 border-b border-slate-700/50">
                    {/* Top row: Badge + Actions */}
                    <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                              {isNewTask ? (
                                   <motion.span
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/25"
                                   >
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        {t('task.newTask')}
                                   </motion.span>
                              ) : taskId ? (
                                   <span className="inline-flex items-center gap-2 bg-slate-700/60 backdrop-blur-sm text-slate-300 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-600/50">
                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                        #{taskId.slice(-6).toUpperCase()}
                                   </span>
                              ) : null}

                              {/* Unsaved changes indicator */}
                              {hasUnsavedChanges && !saving && !isNewTask && (
                                   <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg"
                                   >
                                        <FiSave className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-xs text-amber-400 font-medium">{t('task.unsavedChanges')}</span>
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
                    <div className="flex items-center gap-4">
                         <input
                              ref={titleInputRef}
                              type="text"
                              className="flex-1 bg-transparent text-xl md:text-2xl font-bold text-white placeholder-slate-500 focus:outline-none border-b-2 border-transparent focus:border-purple-500/50 pb-1 transition-colors duration-200"
                              placeholder={t('task.titlePlaceholder')}
                              value={title}
                              onChange={onTitleChange}
                              onKeyDown={onTitleKeyDown}
                         />

                         {!isNewTask && onCompletionToggle !== undefined && completed !== undefined && (
                              <TaskCompletionToggle completed={completed} onToggle={onCompletionToggle} disabled={completionDisabled} disabledTooltip={completionDisabledTooltip} />
                         )}
                    </div>
               </div>
          </div>
     );
};

export default TaskHeader;

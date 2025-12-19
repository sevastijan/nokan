'use client';

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { FaLink, FaTimes } from 'react-icons/fa';
import Button from '../Button/Button';
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
}: TaskHeaderProps) => {
     return (
          <div className="px-6 py-4 border-b border-slate-600">
               <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                         {isNewTask ? (
                              <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded shrink-0">Nowe</span>
                         ) : taskId ? (
                              <span className="bg-slate-700 text-slate-300 text-xs font-mono px-2 py-1 rounded shrink-0">#{taskId.slice(-6)}</span>
                         ) : null}
                         <input
                              ref={titleInputRef}
                              type="text"
                              className="bg-transparent text-lg font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1 truncate min-w-0 flex-1"
                              placeholder="Tytuł zadania (wymagany)"
                              value={title}
                              onChange={onTitleChange}
                              onKeyDown={onTitleKeyDown}
                         />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                         {!isNewTask && taskId && boardId && (
                              <Button variant="ghost" size="sm" icon={<FaLink />} onClick={onCopyLink} className="text-slate-300 hover:text-white" title="Skopiuj link do zadania" />
                         )}
                         <Button variant="ghost" size="sm" icon={<FaTimes />} onClick={onClose} className="text-slate-300 hover:text-white" />
                    </div>
               </div>

               {!isNewTask && (
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                         {hasUnsavedChanges && !saving && (
                              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                   <span className="text-xs text-amber-400 font-medium">Niezapisane zmiany</span>
                                   <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0"></span>
                              </div>
                         )}
                         {onCompletionToggle !== undefined && completed !== undefined && <TaskCompletionToggle completed={completed} onToggle={onCompletionToggle} />}
                    </div>
               )}
          </div>
     );
};

export default TaskHeader;

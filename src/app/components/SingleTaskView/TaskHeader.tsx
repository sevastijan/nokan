'use client';

import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { FaLink, FaTimes } from 'react-icons/fa';
import Button from '../Button/Button';

interface TaskHeaderProps {
     isNewTask: boolean;
     taskId?: string;
     title: string;
     onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
     onTitleKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
     hasUnsavedChanges: boolean;
     saving: boolean;
     onCopyLink: () => void;
     onClose: () => void;
     titleInputRef: RefObject<HTMLInputElement | null>;
}

const TaskHeader = ({ isNewTask, taskId, title, onTitleChange, onTitleKeyDown, hasUnsavedChanges, saving, onCopyLink, onClose, titleInputRef }: TaskHeaderProps) => {
     return (
          <div className="flex justify-between items-start px-6 py-3 border-b border-slate-600">
               <div className="flex justify-between gap-1.5 min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-3 min-w-0">
                         {isNewTask ? (
                              <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded flex-shrink-0">Nowe</span>
                         ) : taskId ? (
                              <span className="bg-slate-700 text-slate-300 text-xs font-mono px-2 py-1 rounded flex-shrink-0">#{taskId.slice(-6)}</span>
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
                    {hasUnsavedChanges && !saving && (
                         <div className="flex items-center gap-1.5 pl-0 sm:pl-[4.5rem] animate-in fade-in slide-in-from-top-1 duration-200">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0"></span>
                              <span className="text-xs text-amber-400 font-medium">Masz niezapisane zmiany</span>
                         </div>
                    )}
               </div>
               <div className="flex items-center gap-2 flex-shrink-0">
                    {!isNewTask && taskId && <Button variant="ghost" size="sm" icon={<FaLink />} onClick={onCopyLink} className="text-slate-300 hover:text-white" />}
                    <Button variant="ghost" size="sm" icon={<FaTimes />} onClick={onClose} className="text-slate-300 hover:text-white" />
               </div>
          </div>
     );
};

export default TaskHeader;

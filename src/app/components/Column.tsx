'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import AddTaskForm from './TaskColumn/AddTaskForm';
import Task from './Task';
import { FaGripVertical, FaTimes } from 'react-icons/fa';
import Button from './Button/Button';
import { Column as ColumnType, Task as TaskType, User, Priority } from '@/app/types/globalTypes';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface ColumnProps {
     column: ColumnType;
     colIndex: number;
     onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
     onRemoveColumn: (columnId: string) => void;
     onTaskAdded: (columnId: string, title: string, priority?: string, userId?: string) => Promise<TaskType>;
     onRemoveTask: (columnId: string, taskId: string) => void;
     onOpenTaskDetail: (taskId: string) => void;
     selectedTaskId: string | null;
     currentUser: User;
     onOpenAddTask: (columnId: string) => void;
     priorities?: Priority[];
     onReorderTasks?: (columnId: string, newOrder: TaskType[]) => void;
     dragHandleProps?: DraggableProvidedDragHandleProps;
     onRegisterScrollRef?: (columnId: string, el: HTMLDivElement | null) => void;
}

const Column = ({
     column,
     onUpdateColumnTitle,
     onRemoveColumn,
     onTaskAdded,
     onRemoveTask,
     onOpenTaskDetail,
     selectedTaskId,
     currentUser,
     onOpenAddTask,
     priorities = [],
     dragHandleProps,
     onRegisterScrollRef,
}: ColumnProps) => {
     const [isEditingTitle, setIsEditingTitle] = useState(false);
     const scrollContainerRef = useRef<HTMLDivElement | null>(null);

     const localTasks = useMemo(() => {
          const arr = Array.isArray(column.tasks) ? column.tasks : [];
          const filtered = arr.filter((t) => t != null);
          const sorted = [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
          const seen = new Set<string>();
          const deduped: TaskType[] = [];
          for (const t of sorted) {
               if (!seen.has(t.id)) {
                    seen.add(t.id);
                    deduped.push(t);
               }
          }
          return deduped;
     }, [column.tasks]);

     return (
          <div className="h-full flex flex-col bg-slate-800/50 border border-slate-700/40 rounded-xl shadow-lg overflow-hidden">
               <div className="flex items-center gap-3 px-4 py-4 bg-slate-800/80 border-b border-slate-700/40">
                    <div className="text-slate-400/60 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors duration-200" {...dragHandleProps}>
                         <FaGripVertical size={18} />
                    </div>

                    <input
                         type="text"
                         defaultValue={column.title}
                         onFocus={() => setIsEditingTitle(true)}
                         onBlur={(e) => {
                              setIsEditingTitle(false);
                              onUpdateColumnTitle(column.id, e.target.value.trim());
                         }}
                         onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                   e.currentTarget.blur();
                              }
                         }}
                         className={`
            flex-1 bg-transparent text-slate-100 text-lg font-semibold
            focus:outline-none focus:ring-2 focus:ring-slate-500/50 rounded-lg px-2 py-1
            transition-all duration-200
            ${isEditingTitle ? 'bg-slate-700/50' : ''}
          `}
                         placeholder="Tytuł kolumny"
                    />

                    <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-slate-300/70 bg-slate-600/20 px-2.5 py-1 rounded-full">{localTasks.length}</span>

                         <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveColumn(column.id)}
                              icon={<FaTimes />}
                              className="p-2 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                         />
                    </div>
               </div>

               <Droppable droppableId={column.id} type="task">
                    {(provided, snapshot) => (
                         <div
                              ref={(el) => {
                                   provided.innerRef(el);
                                   scrollContainerRef.current = el;
                                   onRegisterScrollRef?.(column.id, el);
                              }}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${snapshot.isDraggingOver ? 'bg-slate-700/30' : ''}`}
                              style={{
                                   minHeight: '400px',
                                   maxHeight: 'calc(100vh - 320px)',
                                   overflowAnchor: 'none',
                              }}
                         >
                              {localTasks.length === 0 && !snapshot.isDraggingOver && (
                                   <div className="flex items-center justify-center h-32 text-slate-400/50 text-sm">Brak zadań</div>
                              )}

                              {localTasks.map((task, idx) => (
                                   <Draggable key={task.id} draggableId={task.id} index={idx}>
                                        {(dragProvided, dragSnapshot) => (
                                             <div
                                                  ref={dragProvided.innerRef}
                                                  {...dragProvided.draggableProps}
                                                  {...dragProvided.dragHandleProps}
                                                  className={dragSnapshot.isDragging ? 'opacity-90 shadow-2xl' : ''}
                                             >
                                                  <Task task={task} taskIndex={idx} columnId={column.id} onRemoveTask={onRemoveTask} onOpenTaskDetail={onOpenTaskDetail} priorities={priorities} />
                                             </div>
                                        )}
                                   </Draggable>
                              ))}
                              {provided.placeholder}
                         </div>
                    )}
               </Droppable>

               {/* Add Task Form */}
               <div className="p-3 bg-slate-800/60 border-t border-slate-700/40">
                    <AddTaskForm boardId={column.boardId} columnId={column.id} onTaskAdded={onTaskAdded} currentUser={currentUser} selectedTaskId={selectedTaskId} onOpenAddTask={onOpenAddTask} />
               </div>
          </div>
     );
};

export default Column;

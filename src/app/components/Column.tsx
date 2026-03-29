'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
     onFilterByAssignee?: (assigneeId: string) => void;
     activeFilterAssigneeId?: string | null;
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
     onFilterByAssignee,
     activeFilterAssigneeId,
}: ColumnProps) => {
     const { t } = useTranslation();
     const [isEditingTitle, setIsEditingTitle] = useState(false);
     const [showColorPicker, setShowColorPicker] = useState(false);
     const scrollContainerRef = useRef<HTMLDivElement | null>(null);
     const colorPickerRef = useRef<HTMLDivElement>(null);

     const COLUMN_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

     const colorKey = `col-color-${column.id}`;
     const [columnColor, setColumnColor] = useState<string>(() => {
          if (typeof window !== 'undefined') {
               return localStorage.getItem(colorKey) || '';
          }
          return '';
     });

     const handleColorChange = useCallback((color: string) => {
          setColumnColor(color);
          localStorage.setItem(colorKey, color);
          // Update column object so it propagates
          if (column) (column as unknown as Record<string, unknown>).color = color;
          setShowColorPicker(false);
     }, [colorKey, column]);

     useEffect(() => {
          if (!showColorPicker) return;
          const handler = (e: MouseEvent) => {
               if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) setShowColorPicker(false);
          };
          const timer = setTimeout(() => document.addEventListener('mousedown', handler, true), 0);
          return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler, true); };
     }, [showColorPicker]);

     const handleTitleFocus = useCallback(() => setIsEditingTitle(true), []);

     const handleTitleBlur = useCallback(
          (e: React.FocusEvent<HTMLInputElement>) => {
               setIsEditingTitle(false);
               onUpdateColumnTitle(column.id, e.target.value.trim());
          },
          [column.id, onUpdateColumnTitle],
     );

     const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
               e.currentTarget.blur();
          }
     }, []);

     const handleRemoveClick = useCallback(() => {
          onRemoveColumn(column.id);
     }, [column.id, onRemoveColumn]);

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
          <div className="h-full flex flex-col bg-slate-850 border border-slate-700/50 rounded-lg overflow-hidden">
               <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/60 border-b border-slate-700/50 group/header">
                    <div
                         className="text-slate-500 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors p-1 -ml-1"
                         {...dragHandleProps}
                    >
                         <FaGripVertical size={14} />
                    </div>

                    {/* Color indicator */}
                    <div className="relative" ref={colorPickerRef}>
                         <button
                              onClick={() => setShowColorPicker((p) => !p)}
                              className="w-3 h-3 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-slate-500 transition"
                              style={{ backgroundColor: columnColor || COLUMN_COLORS[column.order % COLUMN_COLORS.length] }}
                              title={t('column.changeColor', 'Zmień kolor statusu')}
                         />
                         {showColorPicker && (
                              <div className="absolute top-6 left-0 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 flex flex-wrap gap-1.5 w-[120px]">
                                   {COLUMN_COLORS.map((c) => (
                                        <button
                                             key={c}
                                             onClick={() => handleColorChange(c)}
                                             className={`w-5 h-5 rounded-full cursor-pointer transition hover:scale-110 ${c === columnColor ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800' : ''}`}
                                             style={{ backgroundColor: c }}
                                        />
                                   ))}
                              </div>
                         )}
                    </div>

                    <input
                         type="text"
                         defaultValue={column.title}
                         onFocus={handleTitleFocus}
                         onBlur={handleTitleBlur}
                         onKeyDown={handleTitleKeyDown}
                         className={`
                              flex-1 bg-transparent text-slate-200 text-sm font-semibold
                              focus:outline-none rounded px-1.5 py-0.5
                              hover:bg-slate-700/50 focus:bg-slate-700/50
                              transition-colors
                         `}
                         placeholder={t('column.columnTitle')}
                    />

                    <div className="flex items-center gap-1.5">
                         <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                              {localTasks.length}
                         </span>

                         <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveClick}
                              icon={<FaTimes size={12} />}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded opacity-0 group-hover/header:opacity-100 transition-all"
                         />
                    </div>
               </div>

               <Droppable droppableId={column.id} type="TASK">
                    {(provided, snapshot) => (
                         <div
                              ref={(el) => {
                                   provided.innerRef(el);
                                   scrollContainerRef.current = el;
                                   onRegisterScrollRef?.(column.id, el);
                              }}
                              {...provided.droppableProps}
                              className={`
                                   flex-1 overflow-y-auto p-2 space-y-2 transition-colors
                                   ${snapshot.isDraggingOver ? 'bg-slate-700/20' : ''}
                              `}
                              style={{
                                   minHeight: '400px',
                                   maxHeight: 'calc(100vh - 280px)',
                                   overflowAnchor: 'none',
                              }}
                         >
                              {localTasks.length === 0 && !snapshot.isDraggingOver && (
                                   <div className="flex flex-col items-center justify-center h-24 text-slate-500 text-sm">
                                        <span>{t('column.noTasks')}</span>
                                   </div>
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
                                                  <Task
                                                       task={task}
                                                       taskIndex={idx}
                                                       columnId={column.id}
                                                       onRemoveTask={onRemoveTask}
                                                       onOpenTaskDetail={onOpenTaskDetail}
                                                       priorities={priorities}
                                                       onFilterByAssignee={onFilterByAssignee}
                                                       activeFilterAssigneeId={activeFilterAssigneeId}
                                                  />
                                             </div>
                                        )}
                                   </Draggable>
                              ))}
                              {provided.placeholder}
                         </div>
                    )}
               </Droppable>

               <div className="p-2 border-t border-slate-700/50">
                    <AddTaskForm
                         boardId={column.boardId}
                         columnId={column.id}
                         onTaskAdded={onTaskAdded}
                         currentUser={currentUser}
                         selectedTaskId={selectedTaskId}
                         onOpenAddTask={onOpenAddTask}
                    />
               </div>
          </div>
     );
};

export default React.memo(Column);

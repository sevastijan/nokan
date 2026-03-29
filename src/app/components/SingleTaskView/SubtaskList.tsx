'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaLayerGroup } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task } from '@/app/types/globalTypes';
import { useAddSubtaskMutation, useUpdateSubtaskCompletionMutation, useRemoveSubtaskMutation, useReorderSubtasksMutation } from '@/app/store/apiSlice';
import SubtaskItem from './SubtaskItem';

interface SubtaskListProps {
     storyId: string;
     boardId: string;
     columnId: string;
     subtasks: Task[];
     onSubtaskOpen?: (subtaskId: string) => void;
     onRefresh?: () => void;
}

const SubtaskList = ({ storyId, boardId, columnId, subtasks = [], onSubtaskOpen, onRefresh }: SubtaskListProps) => {
     const { t } = useTranslation();
     const [isAddingNew, setIsAddingNew] = useState(false);
     const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

     const [addSubtask, { isLoading: isAdding }] = useAddSubtaskMutation();
     const [updateCompletion] = useUpdateSubtaskCompletionMutation();
     const [removeSubtask] = useRemoveSubtaskMutation();
     const [reorderSubtasks] = useReorderSubtasksMutation();

     const completedCount = subtasks.filter((s) => s.completed).length;
     const totalCount = subtasks.length;
     const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

     const handleAddSubtask = async () => {
          if (!newSubtaskTitle.trim() || isAdding) return;

          try {
               await addSubtask({
                    storyId,
                    title: newSubtaskTitle.trim(),
                    boardId,
                    columnId,
               }).unwrap();

               setNewSubtaskTitle('');
               setIsAddingNew(false);
               onRefresh?.();
          } catch (error) {
               console.error('Failed to add subtask:', error);
          }
     };

     const handleToggleComplete = useCallback(
          async (subtaskId: string, completed: boolean) => {
               try {
                    await updateCompletion({
                         subtaskId,
                         completed,
                         storyId,
                    }).unwrap();
                    onRefresh?.();
               } catch (error) {
                    console.error('Failed to update subtask completion:', error);
               }
          },
          [updateCompletion, storyId, onRefresh],
     );

     const handleDelete = useCallback(
          async (subtaskId: string) => {
               try {
                    await removeSubtask({
                         subtaskId,
                         storyId,
                    }).unwrap();
                    onRefresh?.();
               } catch (error) {
                    console.error('Failed to delete subtask:', error);
               }
          },
          [removeSubtask, storyId, onRefresh],
     );

     const handleDragEnd = useCallback(
          async (result: DropResult) => {
               if (!result.destination) return;
               if (result.source.index === result.destination.index) return;

               const reorderedSubtasks = Array.from(subtasks);
               const [removed] = reorderedSubtasks.splice(result.source.index, 1);
               reorderedSubtasks.splice(result.destination.index, 0, removed);

               const subtaskIds = reorderedSubtasks.map((s) => s.id);

               try {
                    await reorderSubtasks({
                         storyId,
                         subtaskIds,
                    }).unwrap();
                    onRefresh?.();
               } catch (error) {
                    console.error('Failed to reorder subtasks:', error);
               }
          },
          [subtasks, reorderSubtasks, storyId, onRefresh],
     );

     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
               e.preventDefault();
               handleAddSubtask();
          } else if (e.key === 'Escape') {
               setIsAddingNew(false);
               setNewSubtaskTitle('');
          }
     };

     return (
          <div>
               {/* Header */}
               <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400">{t('subtasks.title')}</p>
                    {totalCount > 0 && (
                         <span className="text-xs text-slate-500">{completedCount}/{totalCount}</span>
                    )}
               </div>

               {/* Progress bar */}
               {totalCount > 0 && (
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                         <motion.div
                              className="h-full bg-brand-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                         />
                    </div>
               )}

               {/* Subtask list with drag and drop */}
               <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={`subtasks-${storyId}`}>
                         {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                                   <AnimatePresence mode="popLayout">
                                        {subtasks.map((subtask, index) => (
                                             <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
                                                  {(provided, snapshot) => (
                                                       <div ref={provided.innerRef} {...provided.draggableProps}>
                                                            <SubtaskItem
                                                                 subtask={subtask}
                                                                 onToggleComplete={handleToggleComplete}
                                                                 onDelete={handleDelete}
                                                                 onOpen={onSubtaskOpen}
                                                                 isDragging={snapshot.isDragging}
                                                                 dragHandleProps={provided.dragHandleProps}
                                                            />
                                                       </div>
                                                  )}
                                             </Draggable>
                                        ))}
                                   </AnimatePresence>
                                   {provided.placeholder}
                              </div>
                         )}
                    </Droppable>
               </DragDropContext>

               {/* Add subtask */}
               {isAddingNew ? (
                    <div className="mt-2 flex items-center gap-2">
                         <input
                              type="text"
                              value={newSubtaskTitle}
                              onChange={(e) => setNewSubtaskTitle(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={t('subtasks.enterTitle')}
                              autoFocus
                              disabled={isAdding}
                              className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-50"
                         />
                         <button
                              onClick={handleAddSubtask}
                              disabled={!newSubtaskTitle.trim() || isAdding}
                              className="text-xs font-medium text-brand-400 hover:text-brand-300 disabled:text-slate-600 disabled:cursor-not-allowed transition cursor-pointer px-2"
                         >
                              {isAdding ? '...' : '↵'}
                         </button>
                         <button
                              onClick={() => { setIsAddingNew(false); setNewSubtaskTitle(''); }}
                              className="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                         >
                              ✕
                         </button>
                    </div>
               ) : (
                    <div
                         onClick={() => setIsAddingNew(true)}
                         className={`flex items-center justify-center gap-2 border border-dashed border-slate-700/50 rounded-lg cursor-pointer hover:border-slate-600 hover:bg-slate-800/20 transition ${
                              subtasks.length === 0 ? 'py-6 mt-0' : 'py-3 mt-2'
                         }`}
                    >
                         {subtasks.length === 0 && (
                              <FaLayerGroup className="w-4 h-4 text-slate-600" />
                         )}
                         <p className="text-xs text-slate-500">
                              {subtasks.length === 0 ? 'Dodaj pierwszy subtask' : '+ Dodaj subtask'}
                         </p>
                    </div>
               )}
          </div>
     );
};

export default SubtaskList;

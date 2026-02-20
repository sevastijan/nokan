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
          <div className="mt-6">
               {/* Header with progress */}
               <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                         <FaLayerGroup className="w-4 h-4 text-brand-400" />
                         <span className="text-sm font-medium text-slate-200">{t('subtasks.title')}</span>
                         <span className="text-xs text-slate-400">
                              ({completedCount}/{totalCount})
                         </span>
                    </div>
                    {totalCount > 0 && <span className="text-xs text-slate-400">{progressPercent}%</span>}
               </div>

               {/* Progress bar */}
               {totalCount > 0 && (
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                         <motion.div
                              className="h-full bg-linear-to-r from-brand-500 to-green-500 rounded-full"
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

               {/* Empty state */}
               {subtasks.length === 0 && !isAddingNew && <div className="text-center py-4 text-slate-400 text-sm">{t('subtasks.noSubtasks')}</div>}

               {/* Add subtask form */}
               <AnimatePresence>
                    {isAddingNew ? (
                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                              <div className="flex items-center gap-2">
                                   <input
                                        type="text"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t('subtasks.enterTitle')}
                                        autoFocus
                                        disabled={isAdding}
                                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                                   />
                                   <button
                                        onClick={handleAddSubtask}
                                        disabled={!newSubtaskTitle.trim() || isAdding}
                                        className="px-3 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-150"
                                   >
                                        {isAdding ? t('subtasks.adding') : t('common.add')}
                                   </button>
                                   <button
                                        onClick={() => {
                                             setIsAddingNew(false);
                                             setNewSubtaskTitle('');
                                        }}
                                        disabled={isAdding}
                                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 text-sm font-medium rounded-lg transition-colors duration-150"
                                   >
                                        {t('common.cancel')}
                                   </button>
                              </div>
                         </motion.div>
                    ) : (
                         <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              onClick={() => setIsAddingNew(true)}
                              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-brand-400 hover:bg-slate-700/50 rounded-lg transition-colors duration-150"
                         >
                              <FaPlus className="w-3 h-3" />
                              <span>{t('subtasks.addSubtask')}</span>
                         </motion.button>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default SubtaskList;

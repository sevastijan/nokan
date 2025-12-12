'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

interface Task {
     id: string;
     title: string;
     description?: string;
     priority?: string;
     images?: string[];
}

interface TaskModalProps {
     isOpen: boolean;
     onClose: () => void;
     mode: 'add' | 'edit';
     task?: Task;
     columnId?: string;
     onAddTask?: (task: Omit<Task, 'id'> | Task) => void;
     onUpdateTask?: (columnId: string, task: Task) => void;
}

const SimplePrioritySelector = ({ selectedPriority, onChange }: { selectedPriority: string; onChange: (priority: string) => void }) => {
     const [isOpen, setIsOpen] = useState(false);
     const priorities = ['Low', 'Medium', 'High'];

     return (
          <div className="relative">
               <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
               <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-2.5 border border-slate-600 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
               >
                    <span>{selectedPriority}</span>
                    <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>↓</span>
               </button>
               {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                         {priorities.map((priority) => (
                              <button
                                   key={priority}
                                   type="button"
                                   onClick={() => {
                                        onChange(priority);
                                        setIsOpen(false);
                                   }}
                                   className="w-full text-left p-2.5 hover:bg-slate-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              >
                                   {priority}
                              </button>
                         ))}
                    </div>
               )}
          </div>
     );
};

/**
 * Modal component for adding or editing tasks with image upload functionality
 */
const TaskModal = ({ isOpen, onClose, mode, task, columnId, onAddTask, onUpdateTask }: TaskModalProps) => {
     const [title, setTitle] = useState(task?.title || '');
     const [description, setDescription] = useState(task?.description || '');
     const [priority, setPriority] = useState(task?.priority || 'Medium');
     const [isClosing, setIsClosing] = useState(false);
     const [loading, setLoading] = useState(false);

     /**
      * Update form fields when mode or task changes
      */
     useEffect(() => {
          if (mode === 'add') {
               setTitle('');
               setDescription('');
               setPriority('Medium');
          } else if (task) {
               setTitle(task.title);
               setDescription(task.description || '');
               setPriority(task.priority || 'Medium');
          }
     }, [mode, task]);

     /**
      * Trigger modal close with animation
      */
     const triggerClose = useCallback(() => {
          if (isClosing) return;
          setIsClosing(true);
          setTimeout(() => {
               onClose();
               setIsClosing(false);
          }, 300);
     }, [isClosing, onClose]);

     /**
      * Handle saving task (add or update based on mode)
      */
     const handleSave = useCallback(
          (e?: React.MouseEvent | React.TouchEvent) => {
               e?.preventDefault();
               e?.stopPropagation();

               if (!title.trim()) return;

               setLoading(true);

               try {
                    if (mode === 'add' && onAddTask) {
                         onAddTask({ id: '', title, description, priority });
                    } else if (mode === 'edit' && onUpdateTask && task && columnId) {
                         onUpdateTask(columnId, {
                              ...task,
                              title,
                              description,
                              priority,
                         } as Task);
                    }

                    setLoading(false);
                    triggerClose();
               } catch (error) {
                    console.error('Error saving task:', error);
                    setLoading(false);
               }
          },
          [title, description, priority, mode, onAddTask, onUpdateTask, task, columnId, triggerClose],
     );

     /**
      * Handle keyboard events (ESC to close, Enter to save)
      */
     useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
               if (!isOpen) return;

               if (e.key === 'Escape') {
                    e.preventDefault();
                    triggerClose();
               } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (title.trim() && !loading) {
                         handleSave();
                    }
               }
          };

          if (isOpen) {
               document.addEventListener('keydown', handleKeyDown);
          }

          return () => {
               document.removeEventListener('keydown', handleKeyDown);
          };
     }, [isOpen, title, loading, handleSave, triggerClose]);

     /**
      * Handle clicks outside the modal to close it
      */
     const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
          if (e.target === e.currentTarget) {
               triggerClose();
          }
     };

     return (
          <AnimatePresence mode="wait">
               {isOpen && !isClosing && (
                    <motion.div
                         className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
                         onClick={handleOutsideClick}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.3 }}
                    >
                         <motion.div
                              className="bg-slate-800 text-slate-100 rounded-lg p-3 sm:p-4 w-full max-w-xs sm:max-w-sm mx-4 border border-slate-700"
                              initial={{ scale: 0.8, opacity: 0, y: 50 }}
                              animate={{
                                   scale: 1,
                                   opacity: 1,
                                   y: 0,
                              }}
                              exit={{ scale: 0.8, opacity: 0, y: 50 }}
                              transition={{
                                   duration: 0.3,
                                   type: 'spring',
                                   stiffness: 300,
                                   damping: 30,
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                         >
                              <div className="flex justify-between items-center mb-3">
                                   <h2 className="text-base font-semibold">{mode === 'add' ? 'Add Task' : 'Edit Task'}</h2>
                                   <button onClick={triggerClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors duration-200 group" title="Close modal (ESC)">
                                        <IoClose className="w-4 h-4 text-slate-400 group-hover:text-slate-100" />
                                   </button>
                              </div>
                              <div className="space-y-3">
                                   <div>
                                        <input
                                             type="text"
                                             value={title}
                                             onChange={(e) => setTitle(e.target.value)}
                                             className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500"
                                             placeholder="Enter task title"
                                             autoFocus
                                        />
                                   </div>
                                   <div>
                                        <textarea
                                             value={description}
                                             onChange={(e) => setDescription(e.target.value)}
                                             rows={2}
                                             className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:border-slate-500"
                                             placeholder="Enter task description"
                                        />
                                   </div>
                                   <SimplePrioritySelector selectedPriority={priority} onChange={setPriority} />
                              </div>
                              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                                   <button
                                        onClick={triggerClose}
                                        className="w-full sm:w-auto bg-slate-700 text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors duration-200 text-sm order-2 sm:order-1"
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        onClick={handleSave}
                                        disabled={!title.trim() || loading}
                                        className="w-full sm:w-auto bg-slate-600 text-slate-100 px-3 py-2 rounded-lg hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm order-1 sm:order-2"
                                   >
                                        {loading ? 'Saving...' : mode === 'add' ? 'Add Task' : 'Save Changes'}
                                   </button>
                              </div>
                         </motion.div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
};

export default TaskModal;

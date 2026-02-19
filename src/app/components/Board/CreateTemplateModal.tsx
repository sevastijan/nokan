'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, GripVertical } from 'lucide-react';
import { useAddBoardTemplateMutation } from '@/app/store/apiSlice';
import { ApiTemplateResponse, BoardTemplate, CreateTemplateModalProps } from '@/app/types/globalTypes';

interface LocalColumn {
     id: string;
     title: string;
     order: number;
     tasks: { id: string; title: string; description: string }[];
}

const CreateTemplateModal = ({ isOpen, onClose, onTemplateCreated }: CreateTemplateModalProps) => {
     const { t } = useTranslation();
     const [name, setName] = useState('');
     const [description, setDescription] = useState('');
     const [columns, setColumns] = useState<LocalColumn[]>([
          { id: '1', title: 'To Do', order: 0, tasks: [] },
          { id: '2', title: 'In Progress', order: 1, tasks: [] },
          { id: '3', title: 'Done', order: 2, tasks: [] },
     ]);

     const [addBoardTemplate, { isLoading }] = useAddBoardTemplateMutation();

     const addColumn = () => {
          setColumns((prev) => [...prev, { id: Date.now().toString(), title: `Column ${prev.length + 1}`, order: prev.length, tasks: [] }]);
     };

     const removeColumn = (id: string) => {
          if (columns.length <= 1) {
               alert(t('templates.needOneColumn'));
               return;
          }
          setColumns((prev) => prev.filter((col) => col.id !== id));
     };

     const updateColumnTitle = (id: string, title: string) => {
          setColumns((prev) => prev.map((col) => (col.id === id ? { ...col, title } : col)));
     };

     const addTask = (colId: string) => {
          setColumns((prev) =>
               prev.map((col) =>
                    col.id === colId
                         ? {
                                ...col,
                                tasks: [...col.tasks, { id: `${colId}-${Date.now()}`, title: '', description: '' }],
                           }
                         : col,
               ),
          );
     };

     const removeTask = (colId: string, taskId: string) => {
          setColumns((prev) => prev.map((col) => (col.id === colId ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) } : col)));
     };

     const updateTask = (colId: string, taskId: string, changes: Partial<{ title: string; description: string }>) => {
          setColumns((prev) =>
               prev.map((col) =>
                    col.id === colId
                         ? {
                                ...col,
                                tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, ...changes } : t)),
                           }
                         : col,
               ),
          );
     };

     const handleSave = async () => {
          if (!name.trim()) {
               alert(t('templates.templateName'));
               return;
          }

          if (columns.some((col) => !col.title.trim())) {
               alert(t('templates.allColumnsMustHaveTitle'));
               return;
          }

          const payload = {
               name: name.trim(),
               description: description.trim() || null,
               columns: columns.map((col, index) => ({
                    title: col.title.trim(),
                    order: index,
                    tasks: col.tasks.map((task) => ({
                         title: task.title.trim(),
                         description: task.description.trim() || null,
                    })),
               })),
          };

          try {
               const result = await addBoardTemplate(payload).unwrap();

               const res = result as ApiTemplateResponse;

               const sourceColumns = res.template_columns ?? res.columns ?? [];

               const createdTemplate: BoardTemplate = {
                    id: res.id,
                    name: res.name,
                    description: res.description ?? null,
                    is_custom: true,
                    template_columns: sourceColumns.map((col) => ({
                         id: col.id,
                         template_id: res.id,
                         title: col.title,
                         order: col.order,
                         created_at: col.created_at ?? undefined,
                    })),
               };

               onTemplateCreated(createdTemplate);
               handleClose();
          } catch (error) {
               console.error('Failed to create template:', error);
               alert(t('templates.createFailed'));
          }
     };

     const handleClose = () => {
          setName('');
          setDescription('');
          setColumns([
               { id: '1', title: 'To Do', order: 0, tasks: [] },
               { id: '2', title: 'In Progress', order: 1, tasks: [] },
               { id: '3', title: 'Done', order: 2, tasks: [] },
          ]);
          onClose();
     };

     return (
          <AnimatePresence>
               {isOpen && (
                    <motion.div
                         className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         onClick={(e) => e.target === e.currentTarget && handleClose()}
                    >
                         <motion.div
                              className="bg-slate-900/95 border border-slate-700/50 text-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                              initial={{ scale: 0.8, opacity: 0, y: 50 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.8, opacity: 0, y: 50 }}
                              onClick={(e) => e.stopPropagation()}
                         >
                              <div className="flex items-center justify-between mb-6">
                                   <h2 className="text-xl font-bold">{t('templates.createTitle')}</h2>
                                   <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                                        <X size={24} />
                                   </button>
                              </div>

                              <div className="space-y-4">
                                   <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">{t('templates.templateName')}</label>
                                        <input
                                             type="text"
                                             value={name}
                                             onChange={(e) => setName(e.target.value)}
                                             className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-colors"
                                             placeholder={t('templates.templateNamePlaceholder')}
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">{t('templates.templateDescription')}</label>
                                        <textarea
                                             value={description}
                                             onChange={(e) => setDescription(e.target.value)}
                                             className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none placeholder-slate-500 transition-colors"
                                             rows={3}
                                             placeholder={t('templates.templateDescPlaceholder')}
                                        />
                                   </div>

                                   <div>
                                        <div className="flex items-center justify-between mb-3">
                                             <label className="block text-sm font-medium text-slate-300">{t('templates.columnsLabel')}</label>
                                             <button onClick={addColumn} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm">
                                                  <Plus size={16} /> {t('templates.addColumn')}
                                             </button>
                                        </div>

                                        <div className="space-y-4">
                                             {columns.map((column, colIdx) => (
                                                  <div key={column.id} className="bg-slate-800/60 border border-slate-700/30 rounded-lg p-3">
                                                       <div className="flex items-center gap-3 mb-2">
                                                            <GripVertical size={16} className="text-slate-500" />
                                                            <span className="text-sm text-slate-400 w-8">{colIdx + 1}.</span>
                                                            <input
                                                                 type="text"
                                                                 value={column.title}
                                                                 onChange={(e) => updateColumnTitle(column.id, e.target.value)}
                                                                 className="flex-1 bg-slate-900/50 text-white border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500 transition-colors"
                                                                 placeholder={t('templates.columnName')}
                                                            />
                                                            <button
                                                                 onClick={() => removeColumn(column.id)}
                                                                 disabled={columns.length <= 1}
                                                                 className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                 <Trash2 size={16} />
                                                            </button>
                                                       </div>

                                                       <div className="ml-8">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                 <span className="text-xs text-slate-400">{t('templates.starterTasks')}</span>
                                                                 <button onClick={() => addTask(column.id)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                                                                      <Plus size={12} /> {t('templates.addTask')}
                                                                 </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                 {column.tasks.map((task, tIdx) => (
                                                                      <div key={task.id} className="flex items-center gap-2 bg-slate-900/40 border border-slate-700/30 rounded-lg p-2">
                                                                           <span className="text-xs text-slate-400">{tIdx + 1}.</span>
                                                                           <input
                                                                                type="text"
                                                                                value={task.title}
                                                                                onChange={(e) => updateTask(column.id, task.id, { title: e.target.value })}
                                                                                className="flex-1 bg-slate-800/50 text-white border border-slate-700/50 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-slate-500 transition-colors"
                                                                                placeholder={t('templates.taskTitle')}
                                                                           />
                                                                           <input
                                                                                type="text"
                                                                                value={task.description}
                                                                                onChange={(e) => updateTask(column.id, task.id, { description: e.target.value })}
                                                                                className="flex-1 bg-slate-800/50 text-white border border-slate-700/50 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-slate-500 transition-colors"
                                                                                placeholder={t('templates.taskDescription')}
                                                                           />
                                                                           <button onClick={() => removeTask(column.id, task.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                                                                <Trash2 size={14} />
                                                                           </button>
                                                                      </div>
                                                                 ))}
                                                            </div>
                                                       </div>
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              </div>

                              <div className="flex gap-3 mt-6 justify-end">
                                   <button onClick={handleClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 border border-slate-700/50 transition-colors">
                                        {t('common.cancel')}
                                   </button>
                                   <button
                                        onClick={handleSave}
                                        disabled={!name.trim() || isLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        {isLoading ? t('common.saving') : t('templates.createTemplate')}
                                   </button>
                              </div>
                         </motion.div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
};

export default CreateTemplateModal;

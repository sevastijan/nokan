'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { BoardTemplate } from '@/app/types/globalTypes';
import { getBoardTemplates, deleteBoardTemplate } from '@/app/lib/api';
import { TemplateSelectorProps } from '@/app/types/globalTypes';

const TemplateSelector = forwardRef<{ refreshTemplates: () => void }, TemplateSelectorProps>(({ selectedTemplate, onTemplateSelect, onCreateTemplate, disabled = false, refreshTrigger = 0 }, ref) => {
     const [isOpen, setIsOpen] = useState(false);
     const [templates, setTemplates] = useState<BoardTemplate[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     const loadTemplates = async () => {
          try {
               setLoading(true);
               setError(null);
               const fetchedTemplates = await getBoardTemplates();
               setTemplates(fetchedTemplates);
          } catch (err) {
               console.error('Error loading templates:', err);
               setError('Could not load templates');
          } finally {
               setLoading(false);
          }
     };

     useImperativeHandle(ref, () => ({
          refreshTemplates: loadTemplates,
     }));

     useEffect(() => {
          loadTemplates();
     }, [refreshTrigger]);

     const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
          e.stopPropagation();
          if (!confirm('Are you sure you want to delete this template?')) return;
          try {
               await deleteBoardTemplate(templateId);
               await loadTemplates();
               if (selectedTemplate?.id === templateId) {
                    onTemplateSelect?.(null);
               }
          } catch (err) {
               console.error('Error deleting template:', err);
               setError('Failed to delete template');
          }
     };

     return (
          <div className="relative">
               <label className="block text-sm font-medium mb-1.5 text-slate-300">Board template</label>
               <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled || loading}
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 text-sm flex items-center justify-between hover:bg-slate-800/60 transition-colors disabled:opacity-50"
               >
                    <div className="flex flex-col items-start">
                         <span className="font-medium">{loading ? 'Loading...' : error ? 'Error' : selectedTemplate?.name || 'Select template'}</span>
                         {selectedTemplate && !error && <span className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</span>}
                    </div>
                    <ChevronDown size={16} className={`transform transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
               </button>

               {error && <div className="mt-1 text-red-400 text-xs text-center">{error}</div>}

               <AnimatePresence>
                    {isOpen && !loading && !error && (
                         <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute z-50 w-full mt-1 bg-slate-900/95 border border-slate-700/50 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                         >
                              <button
                                   onClick={() => {
                                        onCreateTemplate?.();
                                        setIsOpen(false);
                                   }}
                                   className="w-full p-3 text-left hover:bg-slate-800/60 transition-colors border-b border-slate-700/30 flex items-center gap-2 text-blue-400"
                              >
                                   <Plus size={16} />
                                   <div>
                                        <div className="font-medium">Create new template</div>
                                        <div className="text-xs text-slate-500">Customize your own column layout</div>
                                   </div>
                              </button>

                              {templates.map((template) => (
                                   <div
                                        key={template.id}
                                        className={`p-3 hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between ${
                                             selectedTemplate?.id === template.id ? 'bg-blue-600/10' : ''
                                        }`}
                                        onClick={() => {
                                             onTemplateSelect?.(template);
                                             setIsOpen(false);
                                        }}
                                   >
                                        <div className="flex-1">
                                             <div className="font-medium flex items-center gap-2">
                                                  {template.name}
                                                  {!template.is_custom && <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">Default</span>}
                                             </div>
                                             <div className="text-xs text-slate-400 mt-1">{template.description}</div>
                                             <div className="text-xs text-slate-500 mt-1">Columns: {template.template_columns.map((c) => c.title).join(', ') || 'None'}</div>
                                        </div>
                                        {template.is_custom && (
                                             <button onClick={(e) => handleDeleteTemplate(template.id, e)} className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors">
                                                  <Trash2 size={14} />
                                             </button>
                                        )}
                                   </div>
                              ))}
                              {templates.length === 0 && <div className="p-3 text-slate-500 text-center">No templates</div>}
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
});

TemplateSelector.displayName = 'TemplateSelector';
export default TemplateSelector;

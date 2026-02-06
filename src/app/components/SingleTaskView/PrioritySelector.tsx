'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaFlag, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { getPriorities, addPriority, updatePriority, deletePriority } from '@/app/lib/api';
import { PrioritySelectorProps, Priority } from '@/app/types/globalTypes';
import { useDropdownManager } from '@/app/hooks/useDropdownManager';

const PrioritySelector = ({ selectedPriority, onChange, onDropdownToggle, priorities: externalPriorities }: PrioritySelectorProps) => {
     const dropdownId = useMemo(() => `priority-selector-${Math.random().toString(36).substr(2, 9)}`, []);
     const { isOpen, toggle, close } = useDropdownManager(dropdownId);

     const [priorities, setPriorities] = useState<Priority[]>(externalPriorities || []);
     const [loading, setLoading] = useState<boolean>(!externalPriorities);

     const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
     const [editingId, setEditingId] = useState<string | null>(null);
     const [formData, setFormData] = useState<{ label: string; color: string }>({
          label: '',
          color: '#10b981',
     });
     const [operationLoading, setOperationLoading] = useState<boolean>(false);

     useEffect(() => {
          if (externalPriorities) {
               setPriorities(externalPriorities);
               setLoading(false);
          } else {
               const load = async () => {
                    try {
                         const fetched = await getPriorities();
                         setPriorities(fetched);
                    } catch (err) {
                         console.error('Error loading priorities:', err);
                         setPriorities([
                              { id: 'low', label: 'Low', color: '#10b981' },
                              { id: 'medium', label: 'Medium', color: '#eab308' },
                              { id: 'high', label: 'High', color: '#ef4444' },
                              { id: 'urgent', label: 'Urgent', color: '#dc2626' },
                         ]);
                    } finally {
                         setLoading(false);
                    }
               };
               load();
          }
     }, [externalPriorities]);

     useEffect(() => {
          if (!isOpen) {
               setIsAddingNew(false);
               setEditingId(null);
               setFormData({ label: '', color: '#10b981' });
          }
          onDropdownToggle?.(isOpen);
     }, [isOpen, onDropdownToggle]);

     const selectedObj = useMemo<Priority | null>(() => {
          if (!selectedPriority) return null;
          return priorities.find((p) => p.id === selectedPriority) || null;
     }, [selectedPriority, priorities]);

     const handleSelect = (p: Priority) => {
          onChange(p.id);
          close();
     };

     const handleClear = () => {
          onChange(null);
          close();
     };

     const handleStartAdd = () => {
          setIsAddingNew(true);
          setEditingId(null);
          setFormData({ label: '', color: '#10b981' });
     };

     const handleStartEdit = (p: Priority) => {
          setEditingId(p.id);
          setIsAddingNew(false);
          setFormData({ label: p.label, color: p.color });
     };

     const handleCancel = () => {
          setIsAddingNew(false);
          setEditingId(null);
          setFormData({ label: '', color: '#10b981' });
     };

     const handleSave = async () => {
          if (!formData.label.trim()) return;
          setOperationLoading(true);
          try {
               if (isAddingNew) {
                    const newP = await addPriority(formData.label.trim(), formData.color);
                    setPriorities((prev) => [...prev, newP]);
               } else if (editingId) {
                    const upd = await updatePriority(editingId, formData.label.trim(), formData.color);
                    setPriorities((prev) => prev.map((p) => (p.id === editingId ? upd : p)));
                    if (selectedPriority === editingId) {
                         onChange(editingId);
                    }
               }
               handleCancel();
          } catch (err) {
               console.error('Error saving priority:', err);
               alert('Error saving priority: ' + (err instanceof Error ? err.message : String(err)));
          } finally {
               setOperationLoading(false);
          }
     };

     const handleDelete = async (id: string) => {
          if (!confirm('Delete this priority?')) return;
          setOperationLoading(true);
          try {
               await deletePriority(id);
               setPriorities((prev) => prev.filter((p) => p.id !== id));
               if (selectedPriority === id) {
                    onChange(null);
               }
          } catch (err: unknown) {
               console.error('Error deleting priority:', err);
               const msg = err instanceof Error ? err.message : String(err);
               if (msg.includes('being used')) {
                    alert('Cannot delete: priority is used by existing tasks.');
               } else {
                    alert('Error deleting priority: ' + msg);
               }
          } finally {
               setOperationLoading(false);
          }
     };

     if (loading) {
          return (
               <div className="relative">
                    <div className="w-full min-h-[46px] p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-500 text-sm flex items-center gap-2">
                         <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                         </svg>
                         Ładowanie...
                    </div>
               </div>
          );
     }

     return (
          <div className="relative w-full">
               <button
                    type="button"
                    onClick={toggle}
                    className={`
                         w-full flex items-center justify-between px-3 py-2 min-h-[46px]
                         bg-slate-700/50 border rounded-lg text-slate-200
                         transition-all duration-200
                         ${isOpen ? 'border-purple-500/50 ring-2 ring-purple-500/50 bg-slate-700/70' : 'border-slate-600/50 hover:border-slate-500'}
                    `}
               >
                    <div className="flex items-center gap-2.5 truncate">
                         {selectedObj ? (
                              <>
                                   <div className="w-3 h-3 rounded-full shadow-md" style={{ backgroundColor: selectedObj.color, boxShadow: `0 0 8px ${selectedObj.color}40` }} />
                                   <span className="truncate text-sm font-medium">{selectedObj.label}</span>
                              </>
                         ) : (
                              <>
                                   <FaFlag className="w-3.5 h-3.5 text-slate-500" />
                                   <span className="text-slate-500 truncate text-sm">Wybierz priorytet...</span>
                              </>
                         )}
                    </div>
                    <FaChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                    {isOpen && (
                         <motion.div
                              initial={{ opacity: 0, y: -5, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 mt-2 w-full bg-slate-800 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 max-h-60 overflow-y-auto thin-scrollbar"
                         >
                              <button
                                   type="button"
                                   onClick={handleClear}
                                   className={`
                                        w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                                        transition-all duration-150
                                        ${selectedObj === null ? 'bg-slate-700/50' : 'hover:bg-slate-700/50'}
                                   `}
                              >
                                   <FaTimes className="w-3.5 h-3.5 text-slate-400" />
                                   <span className="text-slate-300 text-sm">Brak priorytetu</span>
                              </button>

                              <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent my-1" />

                              {priorities.length === 0 && <div className="px-3 py-2 text-slate-400 text-sm text-center">No priorities available</div>}

                              {priorities.map((p) => {
                                   const isSel = selectedObj?.id === p.id;
                                   const editing = editingId === p.id;

                                   return (
                                        <div key={p.id} className="relative group">
                                             {editing ? (
                                                  <div className="p-3 bg-slate-700 border-b border-slate-600">
                                                       <input
                                                            type="text"
                                                            value={formData.label}
                                                            onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                                                            className="w-full mb-2 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                                            placeholder="Name"
                                                            disabled={operationLoading}
                                                       />
                                                       <div className="flex items-center gap-2 mb-2">
                                                            <input
                                                                 type="color"
                                                                 value={formData.color}
                                                                 onChange={(e) => setFormData((f) => ({ ...f, color: e.target.value }))}
                                                                 className="w-8 h-8 rounded border border-slate-500"
                                                                 disabled={operationLoading}
                                                            />
                                                            <FaFlag className="w-4 h-4" style={{ color: formData.color }} />
                                                       </div>
                                                       <div className="flex gap-2">
                                                            <button
                                                                 onClick={handleSave}
                                                                 disabled={!formData.label.trim() || operationLoading}
                                                                 className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white text-xs rounded"
                                                            >
                                                                 <FaCheck className="w-3 h-3" />
                                                                 Save
                                                            </button>
                                                            <button
                                                                 onClick={handleCancel}
                                                                 disabled={operationLoading}
                                                                 className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs rounded"
                                                            >
                                                                 <FaTimes className="w-3 h-3" />
                                                                 Cancel
                                                            </button>
                                                       </div>
                                                  </div>
                                             ) : (
                                                  <div className="flex items-center border-b border-slate-600 last:border-b-0">
                                                       <button
                                                            type="button"
                                                            onClick={() => handleSelect(p)}
                                                            className={`
                          w-full flex items-center gap-2 px-3 py-2 text-left 
                          hover:bg-slate-700 transition-colors duration-150
                          ${isSel ? 'bg-purple-600/30' : ''}
                        `}
                                                       >
                                                            <FaFlag className="w-4 h-4" style={{ color: p.color }} />
                                                            <span className="text-slate-200 truncate">{p.label}</span>
                                                       </button>
                                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                            <button
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleStartEdit(p);
                                                                 }}
                                                                 disabled={operationLoading}
                                                                 className="p-1 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                                                            >
                                                                 <FaEdit className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleDelete(p.id);
                                                                 }}
                                                                 disabled={operationLoading}
                                                                 className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                                                            >
                                                                 <FaTrash className="w-3 h-3" />
                                                            </button>
                                                       </div>
                                                  </div>
                                             )}
                                        </div>
                                   );
                              })}

                              {isAddingNew ? (
                                   <div className="p-3 bg-slate-700 border-t border-slate-600">
                                        <input
                                             type="text"
                                             value={formData.label}
                                             onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                                             className="w-full mb-2 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                                             placeholder="New priority name"
                                             disabled={operationLoading}
                                        />
                                        <div className="flex items-center gap-2 mb-2">
                                             <input
                                                  type="color"
                                                  value={formData.color}
                                                  onChange={(e) => setFormData((f) => ({ ...f, color: e.target.value }))}
                                                  className="w-8 h-8 rounded border border-slate-500"
                                                  disabled={operationLoading}
                                             />
                                             <FaFlag className="w-4 h-4" style={{ color: formData.color }} />
                                        </div>
                                        <div className="flex gap-2">
                                             <button
                                                  onClick={handleSave}
                                                  disabled={!formData.label.trim() || operationLoading}
                                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white text-xs rounded"
                                             >
                                                  <FaPlus className="w-3 h-3" />
                                                  Add
                                             </button>
                                             <button
                                                  onClick={handleCancel}
                                                  disabled={operationLoading}
                                                  className="flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs rounded"
                                             >
                                                  <FaTimes className="w-3 h-3" />
                                                  Cancel
                                             </button>
                                        </div>
                                   </div>
                              ) : (
                                   <button
                                        type="button"
                                        onClick={handleStartAdd}
                                        disabled={operationLoading}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-colors duration-150"
                                   >
                                        <FaPlus className="w-4 h-4" />
                                        <span className="text-sm">Add new priority</span>
                                   </button>
                              )}
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
};

export default PrioritySelector;

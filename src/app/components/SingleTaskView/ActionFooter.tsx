'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import ConfirmDialog from './ConfirmDialog';
import { ActionFooterProps } from '@/app/types/globalTypes';

const ActionFooter = ({ isNewTask, hasUnsavedChanges, isSaving, onSave, onClose, onDelete, task, tempTitle }: ActionFooterProps) => {
     const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
     const [showCloseConfirm, setShowCloseConfirm] = useState(false);

     const titleNotEmpty = Boolean(tempTitle && tempTitle.trim().length > 0);
     const canSave = isNewTask ? titleNotEmpty && hasUnsavedChanges : hasUnsavedChanges && titleNotEmpty;

     const handleDeleteClick = () => setShowDeleteConfirm(true);
     const handleDeleteConfirm = () => {
          setShowDeleteConfirm(false);
          onDelete?.();
     };
     const handleDeleteCancel = () => setShowDeleteConfirm(false);

     const handleCloseClick = () => {
          if (hasUnsavedChanges) {
               setShowCloseConfirm(true);
          } else {
               onClose();
          }
     };
     const handleCloseConfirm = () => {
          setShowCloseConfirm(false);
          onClose();
     };
     const handleCloseCancel = () => setShowCloseConfirm(false);

     return (
          <>
               {/* Footer Container */}
               <div className="relative">
                    {/* Gradient separator */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

                    <div className="bg-gradient-to-t from-slate-900/50 to-slate-800/30 backdrop-blur-sm px-6 py-4">
                         <div className="flex items-center justify-between gap-4">
                              {/* Left side: Delete button */}
                              <div className="flex items-center">
                                   {!isNewTask && onDelete && (
                                        <motion.button
                                             whileHover={{ scale: 1.02 }}
                                             whileTap={{ scale: 0.98 }}
                                             onClick={handleDeleteClick}
                                             disabled={isSaving}
                                             className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                                                       text-red-400 bg-red-500/10 border border-red-500/20
                                                       hover:bg-red-500/20 hover:border-red-500/30
                                                       disabled:opacity-50 disabled:cursor-not-allowed
                                                       transition-all duration-200"
                                        >
                                             <FiTrash2 className="w-4 h-4" />
                                             <span className="hidden sm:inline">Usuń</span>
                                        </motion.button>
                                   )}
                              </div>

                              {/* Right side: Cancel + Save buttons */}
                              <div className="flex items-center gap-3">
                                   <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCloseClick}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                                                  text-slate-300 bg-slate-700/50 border border-slate-600/50
                                                  hover:bg-slate-700 hover:border-slate-500
                                                  disabled:opacity-50 disabled:cursor-not-allowed
                                                  transition-all duration-200"
                                   >
                                        <FiX className="w-4 h-4" />
                                        <span>Anuluj</span>
                                   </motion.button>

                                   <motion.button
                                        whileHover={{ scale: canSave && !isSaving ? 1.02 : 1 }}
                                        whileTap={{ scale: canSave && !isSaving ? 0.98 : 1 }}
                                        onClick={onSave}
                                        disabled={!canSave || isSaving}
                                        className={`
                                             flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                                             transition-all duration-200 shadow-lg
                                             ${
                                                  canSave && !isSaving
                                                       ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/25 border border-purple-500/30'
                                                       : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                                             }
                                        `}
                                   >
                                        {isSaving ? (
                                             <>
                                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                       <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                       />
                                                  </svg>
                                                  <span>Zapisywanie...</span>
                                             </>
                                        ) : isNewTask ? (
                                             <>
                                                  <FiPlus className="w-4 h-4" />
                                                  <span>Utwórz zadanie</span>
                                             </>
                                        ) : (
                                             <>
                                                  <FiCheck className="w-4 h-4" />
                                                  <span>Zapisz zmiany</span>
                                             </>
                                        )}
                                   </motion.button>
                              </div>
                         </div>
                    </div>
               </div>

               <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    title="Usuń zadanie"
                    message={`Czy na pewno chcesz usunąć "${task?.title ?? ''}"? Ta akcja jest nieodwracalna.`}
                    confirmText="Usuń"
                    cancelText="Anuluj"
                    type="danger"
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
               />

               <ConfirmDialog
                    isOpen={showCloseConfirm}
                    title="Niezapisane zmiany"
                    message="Masz niezapisane zmiany. Czy na pewno chcesz zamknąć bez zapisywania?"
                    confirmText="Odrzuć zmiany"
                    cancelText="Kontynuuj edycję"
                    type="warning"
                    onConfirm={handleCloseConfirm}
                    onCancel={handleCloseCancel}
               />
          </>
     );
};

export default ActionFooter;

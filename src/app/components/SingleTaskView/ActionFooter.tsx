'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiTrash2, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import ConfirmDialog from './ConfirmDialog';
import { ActionFooterProps } from '@/app/types/globalTypes';

const ActionFooter = ({ isNewTask, hasUnsavedChanges, isSaving, onSave, onClose, onDelete, task, tempTitle }: ActionFooterProps) => {
     const { t } = useTranslation();
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

                    <div className="bg-gradient-to-t from-slate-900/50 to-slate-800/30 backdrop-blur-sm px-3 py-2.5 md:px-6 md:py-4">
                         <div className="flex items-center justify-between gap-2 md:gap-4">
                              {/* Left side: Delete button */}
                              <div className="flex items-center">
                                   {!isNewTask && onDelete && (
                                        <motion.button
                                             whileHover={{ scale: 1.02 }}
                                             whileTap={{ scale: 0.98 }}
                                             onClick={handleDeleteClick}
                                             disabled={isSaving}
                                             className="flex items-center gap-1.5 md:gap-2 px-2.5 py-2 md:px-4 md:py-2.5 rounded-lg text-sm font-medium
                                                       text-red-400 bg-red-500/10 border border-red-500/20
                                                       hover:bg-red-500/20 hover:border-red-500/30
                                                       disabled:opacity-50 disabled:cursor-not-allowed
                                                       transition-all duration-200"
                                        >
                                             <FiTrash2 className="w-4 h-4" />
                                             <span className="hidden sm:inline">{t('common.delete')}</span>
                                        </motion.button>
                                   )}
                              </div>

                              {/* Right side: Cancel + Save buttons */}
                              <div className="flex items-center gap-2 md:gap-3">
                                   <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCloseClick}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm font-medium
                                                  text-slate-300 bg-slate-700/50 border border-slate-600/50
                                                  hover:bg-slate-700 hover:border-slate-500
                                                  disabled:opacity-50 disabled:cursor-not-allowed
                                                  transition-all duration-200"
                                   >
                                        <FiX className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t('common.cancel')}</span>
                                   </motion.button>

                                   <motion.button
                                        whileHover={{ scale: canSave && !isSaving ? 1.02 : 1 }}
                                        whileTap={{ scale: canSave && !isSaving ? 0.98 : 1 }}
                                        onClick={onSave}
                                        disabled={!canSave || isSaving}
                                        className={`
                                             flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-semibold
                                             transition-all duration-200 shadow-lg
                                             ${
                                                  canSave && !isSaving
                                                       ? 'bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-500 hover:to-brand-500 text-white shadow-brand-500/25 border border-brand-500/30'
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
                                                  <span>{t('task.saving')}</span>
                                             </>
                                        ) : isNewTask ? (
                                             <>
                                                  <FiPlus className="w-4 h-4" />
                                                  <span>{t('task.createTask')}</span>
                                             </>
                                        ) : (
                                             <>
                                                  <FiCheck className="w-4 h-4" />
                                                  <span>{t('task.saveChanges')}</span>
                                             </>
                                        )}
                                   </motion.button>
                              </div>
                         </div>
                    </div>
               </div>

               <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    title={t('task.deleteTitle')}
                    message={t('task.deleteConfirm', { title: task?.title ?? '' })}
                    confirmText={t('common.delete')}
                    cancelText={t('common.cancel')}
                    type="danger"
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
               />

               <ConfirmDialog
                    isOpen={showCloseConfirm}
                    title={t('task.unsavedChanges')}
                    message={t('task.unsavedChangesMessage')}
                    confirmText={t('task.discardChanges')}
                    cancelText={t('task.continueEditing')}
                    type="warning"
                    onConfirm={handleCloseConfirm}
                    onCancel={handleCloseCancel}
               />
          </>
     );
};

export default ActionFooter;

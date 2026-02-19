'use client';

import { motion } from 'framer-motion';
import { FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { ConfirmDialogProps } from '@/app/types/globalTypes';

const ConfirmDialog = ({ isOpen, title, message, confirmText = 'OK', cancelText = 'Anuluj', onConfirm, onCancel, type = 'warning' }: ConfirmDialogProps) => {
     if (!isOpen) return null;

     const getConfig = () => {
          switch (type) {
               case 'danger':
                    return {
                         Icon: FiAlertCircle,
                         iconBg: 'bg-red-500/15',
                         iconColor: 'text-red-400',
                         buttonBg: 'bg-red-600 hover:bg-red-500',
                         borderColor: 'border-red-500/30',
                    };
               case 'warning':
                    return {
                         Icon: FiAlertTriangle,
                         iconBg: 'bg-amber-500/15',
                         iconColor: 'text-amber-400',
                         buttonBg: 'bg-amber-600 hover:bg-amber-500',
                         borderColor: 'border-amber-500/30',
                    };
               default:
                    return {
                         Icon: FiInfo,
                         iconBg: 'bg-purple-500/15',
                         iconColor: 'text-purple-400',
                         buttonBg: 'bg-purple-600 hover:bg-purple-500',
                         borderColor: 'border-purple-500/30',
                    };
          }
     };

     const config = getConfig();
     const Icon = config.Icon;

     return (
          <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 backdrop-blur-md bg-black/60 flex items-center justify-center z-[70] p-4"
          >
               <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`bg-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl shadow-black/40 border ${config.borderColor}`}
               >
                    <div className="flex items-start gap-4 mb-5">
                         <div className={`p-3 rounded-xl ${config.iconBg}`}>
                              <Icon className={`w-6 h-6 ${config.iconColor}`} />
                         </div>
                         <div className="flex-1 min-w-0 pt-1">
                              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                              <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                         </div>
                    </div>
                    <div className="flex justify-end gap-3">
                         <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={onCancel}
                              className="px-4 py-2.5 text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 text-sm font-medium"
                         >
                              {cancelText}
                         </motion.button>
                         <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={onConfirm}
                              className={`px-4 py-2.5 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg ${config.buttonBg}`}
                         >
                              {confirmText}
                         </motion.button>
                    </div>
               </motion.div>
          </motion.div>
     );
};

export default ConfirmDialog;

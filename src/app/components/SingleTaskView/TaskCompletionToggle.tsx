import { useTranslation } from 'react-i18next';
import { FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface TaskCompletionToggleProps {
     completed: boolean;
     onToggle: (completed: boolean) => void;
     disabled?: boolean;
     disabledTooltip?: string;
}

const TaskCompletionToggle = ({ completed, onToggle, disabled, disabledTooltip }: TaskCompletionToggleProps) => {
     const { t } = useTranslation();
     return (
          <motion.button
               whileHover={disabled ? {} : { scale: 1.02 }}
               whileTap={disabled ? {} : { scale: 0.98 }}
               onClick={() => {
                    if (disabled) return;
                    onToggle(!completed);
               }}
               className={`
                    group flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300
                    ${
                         disabled
                              ? 'bg-slate-700/30 border border-slate-600/30 opacity-60 cursor-not-allowed'
                              : completed
                                   ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                   : 'bg-slate-700/40 border border-slate-600/50 hover:border-emerald-500/30 hover:bg-slate-700/60'
                    }
               `}
               title={disabled ? (disabledTooltip || t('completion.completeSubtasksFirst')) : completed ? t('completion.markIncomplete') : t('completion.markComplete')}
          >
               <div
                    className={`
                         w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300
                         ${
                              completed
                                   ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-md shadow-emerald-500/30'
                                   : 'border-2 border-slate-500 group-hover:border-emerald-500/50'
                         }
                    `}
               >
                    {completed && (
                         <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                              <FiCheck className="w-3.5 h-3.5 text-white stroke-[3]" />
                         </motion.div>
                    )}
               </div>
               <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                         completed ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
               >
                    {completed ? t('completion.completed') : t('completion.todo')}
               </span>
          </motion.button>
     );
};

export default TaskCompletionToggle;

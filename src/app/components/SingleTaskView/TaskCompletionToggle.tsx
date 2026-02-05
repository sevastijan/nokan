import { FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface TaskCompletionToggleProps {
     completed: boolean;
     onToggle: (completed: boolean) => void;
}

const TaskCompletionToggle = ({ completed, onToggle }: TaskCompletionToggleProps) => {
     return (
          <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => onToggle(!completed)}
               className={`
                    group flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300
                    ${
                         completed
                              ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                              : 'bg-slate-700/40 border border-slate-600/50 hover:border-emerald-500/30 hover:bg-slate-700/60'
                    }
               `}
               title={completed ? 'Oznacz jako niezakończone' : 'Oznacz jako zakończone'}
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
                    {completed ? 'Zakończone' : 'Do wykonania'}
               </span>
          </motion.button>
     );
};

export default TaskCompletionToggle;

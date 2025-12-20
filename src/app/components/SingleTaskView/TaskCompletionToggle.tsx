import { FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface TaskCompletionToggleProps {
     completed: boolean;
     onToggle: (completed: boolean) => void;
}

const TaskCompletionToggle = ({ completed, onToggle }: TaskCompletionToggleProps) => {
     return (
          <button
               onClick={() => onToggle(!completed)}
               className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md transition-all
        ${completed ? 'bg-green-500/20 border border-green-500/40 hover:bg-green-500/30' : 'bg-slate-700/50 border border-slate-600 hover:border-green-500/50 hover:bg-slate-700'}
      `}
               title={completed ? 'Oznacz jako niezakończone' : 'Oznacz jako zakończone'}
          >
               <div
                    className={`
          w-4 h-4 rounded border-2 flex items-center justify-center transition-all
          ${completed ? 'bg-green-500 border-green-500' : 'border-slate-500'}
        `}
               >
                    {completed && (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                              <FiCheckCircle className="w-3 h-3 text-white" />
                         </motion.div>
                    )}
               </div>
               <span className={`text-xs font-medium ${completed ? 'text-green-400' : 'text-slate-300'}`}>Zakończone</span>
          </button>
     );
};

export default TaskCompletionToggle;

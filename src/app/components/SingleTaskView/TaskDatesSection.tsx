'use client';

import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { calculateDuration } from '@/app/utils/helpers';

interface TaskDatesSectionProps {
     startDate: string;
     endDate: string;
     onDateChange: (type: 'start' | 'end', value: string) => void;
}

const TaskDatesSection = ({ startDate, endDate, onDateChange }: TaskDatesSectionProps) => {
     const duration = startDate && endDate ? calculateDuration(startDate, endDate) : null;

     return (
          <>
               <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                    <div className="flex-1">
                         <span className="text-sm flex items-center gap-1 text-slate-300">
                              <FaClock className="w-4 h-4" /> Data rozpoczęcia
                         </span>
                         <input
                              type="date"
                              className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              value={startDate}
                              onChange={(e) => onDateChange('start', e.target.value)}
                         />
                    </div>
                    <div className="flex-1">
                         <label className="text-sm flex items-center gap-1 text-slate-300">
                              <FaClock className="w-4 h-4" /> Termin
                         </label>
                         <input
                              type="date"
                              className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              value={endDate}
                              min={startDate || undefined}
                              onChange={(e) => onDateChange('end', e.target.value)}
                         />
                    </div>
               </div>

               {duration !== null && (
                    <div className="p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 flex items-center gap-2">
                         <FaCalendarAlt className="text-white w-4 h-4" />
                         <span className="font-medium">
                              Czas trwania: {duration} {duration === 1 ? 'dzień' : 'dni'}
                         </span>
                    </div>
               )}
          </>
     );
};

export default TaskDatesSection;

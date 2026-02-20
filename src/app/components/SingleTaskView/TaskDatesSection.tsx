'use client';

import { FiCalendar, FiClock, FiArrowRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { calculateDuration } from '@/app/utils/helpers';

interface TaskDatesSectionProps {
     startDate: string;
     endDate: string;
     onDateChange: (type: 'start' | 'end', value: string) => void;
}

const TaskDatesSection = ({ startDate, endDate, onDateChange }: TaskDatesSectionProps) => {
     const { t } = useTranslation();
     const duration = startDate && endDate ? calculateDuration(startDate, endDate) : null;

     return (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3 md:p-4">
               {/* Section Header */}
               <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-700/30">
                    <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('taskDates.dates')}</h3>
                    {duration !== null && (
                         <span className="ml-auto flex items-center gap-1.5 text-xs bg-brand-500/10 text-brand-300 px-2.5 py-1 rounded-full border border-brand-500/20">
                              <FiClock className="w-3 h-3" />
                              {duration} {t('common.day', { count: duration })}
                         </span>
                    )}
               </div>

               {/* Date Inputs */}
               <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                    {/* Start Date */}
                    <div className="flex-1">
                         <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                              <FiCalendar className="w-4 h-4 text-green-400" />
                              <span>{t('taskDates.startDate')}</span>
                         </label>
                         <input
                              type="date"
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white
                                        focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                                        transition-all duration-200 hover:border-slate-500
                                        [&::-webkit-calendar-picker-indicator]:brightness-0
                                        [&::-webkit-calendar-picker-indicator]:invert
                                        [&::-webkit-calendar-picker-indicator]:opacity-50
                                        [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                                        [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              value={startDate}
                              onChange={(e) => onDateChange('start', e.target.value)}
                         />
                    </div>

                    {/* Arrow indicator */}
                    <div className="hidden md:flex items-center justify-center pb-3">
                         <FiArrowRight className="w-5 h-5 text-slate-500" />
                    </div>

                    {/* End Date */}
                    <div className="flex-1">
                         <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                              <FiCalendar className="w-4 h-4 text-red-400" />
                              <span>{t('taskDates.dueDate')}</span>
                         </label>
                         <input
                              type="date"
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white
                                        focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                                        transition-all duration-200 hover:border-slate-500
                                        [&::-webkit-calendar-picker-indicator]:brightness-0
                                        [&::-webkit-calendar-picker-indicator]:invert
                                        [&::-webkit-calendar-picker-indicator]:opacity-50
                                        [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                                        [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              value={endDate}
                              min={startDate || undefined}
                              onChange={(e) => onDateChange('end', e.target.value)}
                         />
                    </div>
               </div>
          </div>
     );
};

export default TaskDatesSection;

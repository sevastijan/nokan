'use client';

import { FaCheckSquare, FaLayerGroup, FaBug } from 'react-icons/fa';
import { TaskType } from '@/app/types/globalTypes';

interface TaskVariantSelectorProps {
     selectedType: TaskType;
     onChange: (type: TaskType) => void;
     /** Large tile mode for initial variant picker screen */
     large?: boolean;
}

const VARIANTS: {
     value: TaskType;
     label: string;
     description: string;
     icon: React.ReactNode;
     iconLarge: React.ReactNode;
     activeClasses: string;
     activeBg: string;
}[] = [
     {
          value: 'task',
          label: 'Nowe zadanie',
          description: 'Proste zadanie bez subtaskow',
          icon: <FaCheckSquare className="w-4 h-4" />,
          iconLarge: <FaCheckSquare className="w-8 h-8" />,
          activeClasses: 'border-blue-500/60 bg-blue-500/15 text-blue-300',
          activeBg: 'bg-blue-500/20',
     },
     {
          value: 'story',
          label: 'Story',
          description: 'Zadanie z subtaskami',
          icon: <FaLayerGroup className="w-4 h-4" />,
          iconLarge: <FaLayerGroup className="w-8 h-8" />,
          activeClasses: 'border-purple-500/60 bg-purple-500/15 text-purple-300',
          activeBg: 'bg-purple-500/20',
     },
     {
          value: 'bug',
          label: 'Bug',
          description: 'Zgloszenie bledu z linkiem i scenariuszem',
          icon: <FaBug className="w-4 h-4" />,
          iconLarge: <FaBug className="w-8 h-8" />,
          activeClasses: 'border-red-500/60 bg-red-500/15 text-red-300',
          activeBg: 'bg-red-500/20',
     },
];

const TaskVariantSelector = ({ selectedType, onChange, large }: TaskVariantSelectorProps) => {
     if (large) {
          return (
               <div className="grid grid-cols-3 gap-5">
                    {VARIANTS.map((variant) => {
                         const isActive = selectedType === variant.value;
                         return (
                              <button
                                   key={variant.value}
                                   type="button"
                                   onClick={() => onChange(variant.value)}
                                   className={`
                                        group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2
                                        transition-all duration-200 h-48
                                        ${isActive
                                             ? `${variant.activeClasses} shadow-lg`
                                             : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:bg-slate-700/30 hover:scale-[1.02]'
                                        }
                                   `}
                              >
                                   <div
                                        className={`p-4 rounded-xl transition-colors duration-200 ${
                                             isActive ? variant.activeBg : 'bg-slate-700/50 group-hover:bg-slate-700/70'
                                        }`}
                                   >
                                        {variant.iconLarge}
                                   </div>
                                   <span className="text-sm font-semibold">{variant.label}</span>
                                   <span className="text-xs text-slate-500 text-center leading-tight line-clamp-2 h-8">{variant.description}</span>
                              </button>
                         );
                    })}
               </div>
          );
     }

     return (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
               <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                    <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Typ zadania</h3>
               </div>
               <div className="grid grid-cols-3 gap-3">
                    {VARIANTS.map((variant) => {
                         const isActive = selectedType === variant.value;
                         return (
                              <button
                                   key={variant.value}
                                   type="button"
                                   onClick={() => onChange(variant.value)}
                                   className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                                        ${isActive ? variant.activeClasses : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:bg-slate-700/40'}
                                   `}
                              >
                                   <div
                                        className={`p-2 rounded-lg ${isActive ? variant.activeBg : 'bg-slate-700/50'}`}
                                   >
                                        {variant.icon}
                                   </div>
                                   <span className="text-sm font-medium">{variant.label}</span>
                              </button>
                         );
                    })}
               </div>
          </div>
     );
};

export default TaskVariantSelector;

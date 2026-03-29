'use client';

import { useTranslation } from 'react-i18next';
import { FaCheckSquare, FaLayerGroup, FaFire } from 'react-icons/fa';
import { TaskType } from '@/app/types/globalTypes';

interface TaskVariantSelectorProps {
     selectedType: TaskType;
     onChange: (type: TaskType) => void;
     large?: boolean;
}

const TaskVariantSelector = ({ selectedType, onChange, large }: TaskVariantSelectorProps) => {
     const { t } = useTranslation();

     const VARIANTS: { value: TaskType; label: string; description: string; icon: React.ReactNode }[] = [
          {
               value: 'task',
               label: t('taskVariant.newTask'),
               description: t('taskVariant.newTaskDesc'),
               icon: <FaCheckSquare className={large ? 'w-5 h-5' : 'w-4 h-4'} />,
          },
          {
               value: 'story',
               label: t('taskVariant.story'),
               description: t('taskVariant.storyDesc'),
               icon: <FaLayerGroup className={large ? 'w-5 h-5' : 'w-4 h-4'} />,
          },
          {
               value: 'bug',
               label: t('taskVariant.bug'),
               description: t('taskVariant.bugDesc'),
               icon: <FaFire className={large ? 'w-5 h-5' : 'w-4 h-4'} />,
          },
     ];

     const renderCards = () => (
          <div className="grid grid-cols-3 gap-2">
               {VARIANTS.map((variant) => {
                    const isActive = selectedType === variant.value;
                    return (
                         <div
                              key={variant.value}
                              onClick={() => onChange(variant.value)}
                              className={`rounded-lg cursor-pointer transition ${
                                   isActive
                                        ? 'bg-slate-800 ring-1 ring-brand-500/40'
                                        : 'bg-slate-800/50 hover:bg-slate-800'
                              }`}
                         >
                              <div className="px-3 py-2.5">
                                   <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                             isActive ? 'border-brand-500' : 'border-slate-600'
                                        }`}>
                                             {isActive && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                                        </div>
                                        <div className={`shrink-0 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                                             {variant.icon}
                                        </div>
                                        <p className={`text-sm ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{variant.label}</p>
                                   </div>
                                   <p className="text-[11px] text-slate-500 leading-tight pl-6">{variant.description}</p>
                              </div>
                         </div>
                    );
               })}
          </div>
     );

     if (large) {
          return (
               <div>
                    <p className="text-xs text-slate-400 mb-1">Co chcesz utworzyć?</p>
                    <p className="text-[11px] text-slate-500 mb-3">Wybierz typ zadania, które chcesz dodać</p>
                    {renderCards()}
               </div>
          );
     }

     return (
          <div>
               <p className="text-xs text-slate-400 mb-2">{t('taskVariant.taskType')}</p>
               {renderCards()}
          </div>
     );
};

export default TaskVariantSelector;

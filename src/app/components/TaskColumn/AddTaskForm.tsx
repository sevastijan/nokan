'use client';

import { JSX, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus } from 'react-icons/fi';
import { AddTaskFormProps } from './types';

const AddTaskForm = ({ columnId, onOpenAddTask }: AddTaskFormProps): JSX.Element => {
     const { t } = useTranslation();
     const handleClick = useCallback(() => {
          onOpenAddTask(columnId);
     }, [columnId, onOpenAddTask]);

     return (
          <button
               onClick={handleClick}
               className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors"
          >
               <FiPlus size={16} />
               <span>{t('column.addTask')}</span>
          </button>
     );
};

export default AddTaskForm;

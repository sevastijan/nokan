import { useState, useEffect } from 'react';
import { TaskDetail } from '@/app/types/globalTypes';

export function useDateChange(task: TaskDetail | null, updateTask: (updates: Partial<TaskDetail>) => void) {
     const [startDate, setStartDate] = useState<string>(task?.start_date ?? '');
     const [endDate, setEndDate] = useState<string>(task?.end_date ?? '');

     useEffect(() => {
          setStartDate(task?.start_date ?? '');
          setEndDate(task?.end_date ?? '');
     }, [task, setStartDate, setEndDate]);

     const handleStartChange = (value: string) => {
          setStartDate(value);
          updateTask({ start_date: value || null });
     };

     const handleEndChange = (value: string) => {
          setEndDate(value);
          updateTask({ end_date: value || null });
     };

     return { startDate, endDate, handleStartChange, handleEndChange };
}

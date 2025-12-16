import { useState, useEffect } from 'react';
import { TaskDetail } from '@/app/types/globalTypes';

export function useDescriptionChange(task: TaskDetail | null, updateTask: (updates: Partial<TaskDetail>) => void) {
     const [description, setDescription] = useState<string>(task?.description ?? '');

     useEffect(() => {
          setDescription(task?.description ?? '');
     }, [task, setDescription]);

     const handleChange = (newDesc: string) => {
          setDescription(newDesc);
          updateTask({ description: newDesc || null });
     };

     return { description, handleChange };
}

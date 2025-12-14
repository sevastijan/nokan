import { useState, useCallback } from 'react';
import { User } from '@/app/types/globalTypes';

interface TaskFormData {
     tempTitle: string;
     tempDescription: string;
     selectedAssignees: User[];
     startDate: string;
     endDate: string;
     localColumnId: string | undefined;
}

interface TaskData {
     title?: string | null;
     description?: string | null;
     collaborators?: User[] | null;
     column_id?: string | null;
     start_date?: string | null;
     end_date?: string | null;
}

interface UseTaskFormProps {
     initialColumnId?: string;
}

export const useTaskForm = ({ initialColumnId }: UseTaskFormProps) => {
     const [formData, setFormData] = useState<TaskFormData>({
          tempTitle: '',
          tempDescription: '',
          selectedAssignees: [],
          startDate: '',
          endDate: '',
          localColumnId: initialColumnId,
     });

     const updateField = useCallback(<K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
          setFormData((prev) => ({ ...prev, [field]: value }));
     }, []);

     const syncWithTask = useCallback((taskData: TaskData | null | undefined, columnId?: string) => {
          if (!taskData) return;

          setFormData({
               tempTitle: taskData.title || '',
               tempDescription: taskData.description || '',
               selectedAssignees: taskData.collaborators || [],
               localColumnId: taskData.column_id || columnId,
               startDate: taskData.start_date || '',
               endDate: taskData.end_date || '',
          });
     }, []);

     return {
          formData,
          setFormData,
          updateField,
          syncWithTask,
     };
};

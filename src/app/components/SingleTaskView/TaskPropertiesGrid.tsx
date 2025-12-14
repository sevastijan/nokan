'use client';

import UserSelector from './UserSelector';
import PrioritySelector from './PrioritySelector';
import ColumnSelector from '@/app/components/ColumnSelector';
import { Column } from '@/app/types/globalTypes';

interface TaskPropertiesGridProps {
     selectedAssignees: Array<{
          id: string;
          name?: string | null;
          image?: string | null;
          custom_name?: string | null;
          custom_image?: string | null;
          email: string;
     }>;
     availableUsers: Array<{
          id: string;
          name?: string | null;
          image?: string | null;
          custom_name?: string | null;
          custom_image?: string | null;
          email: string;
     }>;
     onAssigneesChange: (userIds: string[]) => void;
     selectedPriority: string | null;
     onPriorityChange: (priorityId: string | null) => void;
     columns: Column[];
     localColumnId?: string;
     onColumnChange: (newColId: string) => void;
}

const TaskPropertiesGrid = ({ selectedAssignees, availableUsers, onAssigneesChange, selectedPriority, onPriorityChange, columns, localColumnId, onColumnChange }: TaskPropertiesGridProps) => {
     return (
          <>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UserSelector selectedUsers={selectedAssignees} availableUsers={availableUsers} onUsersChange={onAssigneesChange} label="Przypisani" />
                    <PrioritySelector selectedPriority={selectedPriority} onChange={onPriorityChange} />
               </div>

               <div className="hidden md:block">
                    <ColumnSelector columns={columns} value={localColumnId} onChange={onColumnChange} />
               </div>
          </>
     );
};

export default TaskPropertiesGrid;

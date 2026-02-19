'use client';

import { FiUsers, FiFlag, FiColumns } from 'react-icons/fi';
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
     hideAssignees?: boolean;
}

const TaskPropertiesGrid = ({ selectedAssignees, availableUsers, onAssigneesChange, selectedPriority, onPriorityChange, columns, localColumnId, onColumnChange, hideAssignees }: TaskPropertiesGridProps) => {
     return (
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-4">
               {/* Section Header */}
               <div className="flex items-center gap-2 pb-2 border-b border-slate-700/30">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-500 rounded-full" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Właściwości</h3>
               </div>

               {/* Properties Grid */}
               <div className={`grid grid-cols-1 ${hideAssignees ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                    {/* Assignees */}
                    {!hideAssignees && (
                         <div className="md:col-span-1">
                              <div className="flex items-center gap-2 mb-2">
                                   <FiUsers className="w-3.5 h-3.5 text-purple-400" />
                                   <span className="text-xs text-slate-400">Przypisani</span>
                              </div>
                              <UserSelector selectedUsers={selectedAssignees} availableUsers={availableUsers} onUsersChange={onAssigneesChange} label="" />
                         </div>
                    )}

                    {/* Priority */}
                    <div className="md:col-span-1">
                         <div className="flex items-center gap-2 mb-2">
                              <FiFlag className="w-3.5 h-3.5 text-orange-400" />
                              <span className="text-xs text-slate-400">Priorytet</span>
                         </div>
                         <PrioritySelector selectedPriority={selectedPriority} onChange={onPriorityChange} />
                    </div>

                    {/* Column */}
                    <div className="md:col-span-1">
                         <div className="flex items-center gap-2 mb-2">
                              <FiColumns className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-xs text-slate-400">Kolumna</span>
                         </div>
                         <ColumnSelector columns={columns} value={localColumnId} onChange={onColumnChange} />
                    </div>
               </div>
          </div>
     );
};

export default TaskPropertiesGrid;

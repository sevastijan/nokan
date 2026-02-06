import { Users } from 'lucide-react';
import { TeamListProps } from '@/app/types/globalTypes';
import TeamListItem from './TeamListItem';

const TeamList = ({ teams, onEditTeam, onDeleteTeam, availableUsers }: TeamListProps) => {
     if (!teams || teams.length === 0) {
          return (
               <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                         <Users className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No teams yet</h3>
                    <p className="text-slate-400">Create your first team to get started with collaboration!</p>
               </div>
          );
     }

     return (
          <div>
               <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                    Your Teams
                    <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2.5 py-1 rounded-lg">
                         {teams.length}
                    </span>
               </h3>
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teams.map((team) => (
                         <TeamListItem key={team.id} team={team} onEditTeam={onEditTeam} onDeleteTeam={onDeleteTeam} availableUsers={availableUsers} />
                    ))}
               </div>
          </div>
     );
};

export default TeamList;

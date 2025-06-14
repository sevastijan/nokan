// src/app/components/TeamManagement/TeamList.tsx
import { TeamListProps } from "@/app/types/globalTypes";
import TeamListItem from "./TeamListItem";

const TeamList = ({
  teams,
  onEditTeam,
  onDeleteTeam,
  availableUsers,
}: TeamListProps) => {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-white mb-2">No teams yet</h3>
        <p className="text-slate-400">
          Create your first team to get started with collaboration!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></span>
        Your Teams ({teams.length})
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => (
          <TeamListItem
            key={team.id}
            team={team}
            onEditTeam={onEditTeam}
            onDeleteTeam={onDeleteTeam}
            availableUsers={availableUsers}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamList;

import { TeamListProps } from "./types";
import TeamListItem from "./TeamListItem";

const TeamList = ({
  teams,
  onEditTeam,
  onDeleteTeam,
  availableUsers,
}: TeamListProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-300 mb-4">
        Existing Teams
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

import React from "react";
import { TeamListItemProps } from "./types";
import DOMPurify from "dompurify";

const TeamListItem = ({
  team,
  onEditTeam,
  onDeleteTeam,
  availableUsers,
}: TeamListItemProps) => {
  const members = availableUsers
    .filter((user) => team.users.find((member) => member.user_id === user.id))
    .map((user) => user.name)
    .join(", ");

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl shadow-lg p-6 flex flex-col gap-4">
      <div
        className="font-semibold text-lg text-white"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(team.name),
        }}
      />
      <div className="text-gray-300 text-sm break-words">
        <span className="font-medium text-gray-400">Members:</span> {members}
      </div>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => onEditTeam(team)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDeleteTeam(team.id)}
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TeamListItem;

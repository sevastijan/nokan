import React from "react";
import { TeamListItemProps } from "./types";
import DOMPurify from "dompurify";
import { FiEdit3, FiTrash2, FiUsers } from "react-icons/fi";
import Avatar from "../Avatar/Avatar";

const TeamListItem = ({
  team,
  onEditTeam,
  onDeleteTeam,
  availableUsers,
}: TeamListItemProps) => {
  const teamMembers = availableUsers.filter((user) =>
    team.users.find((member) => member.user_id === user.id)
  );

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-200 group hover:shadow-xl hover:shadow-purple-500/10 min-h-[280px] flex flex-col">
      {/* Team Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4
              className="font-semibold text-xl text-white group-hover:text-purple-300 transition-colors leading-tight"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(team.name),
              }}
            />
            <p className="text-slate-400 text-sm mt-1">
              {teamMembers.length} members
            </p>
          </div>
        </div>
      </div>

      {/* Team Members - Expanduje żeby wypełnić przestrzeń */}
      <div className="flex-1 mb-6">
        <p className="text-slate-400 text-sm font-medium mb-4">Team Members</p>
        <div className="space-y-3">
          {teamMembers.slice(0, 4).map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 bg-slate-700/30 rounded-xl px-4 py-3 hover:bg-slate-700/50 transition-colors"
            >
              <Avatar src={user.image} alt={user.name} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.name}
                </p>
                <p className="text-slate-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
          ))}
          {teamMembers.length > 4 && (
            <div className="flex items-center justify-center bg-slate-700/30 rounded-xl px-4 py-3">
              <span className="text-slate-400 text-sm font-medium">
                +{teamMembers.length - 4} more members
              </span>
            </div>
          )}
          {teamMembers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm">No members assigned</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Na dole */}
      <div className="flex gap-3 pt-4 border-t border-slate-700/50">
        <button
          onClick={() => onEditTeam(team)}
          className="flex-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-purple-500/30 hover:border-purple-400/50"
        >
          <FiEdit3 className="w-4 h-4" />
          Edit Team
        </button>
        <button
          onClick={() => onDeleteTeam(team.id)}
          className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-medium px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-400/50"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TeamListItem;

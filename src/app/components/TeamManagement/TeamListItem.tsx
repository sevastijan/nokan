import DOMPurify from 'dompurify';
import { Users, Pencil, Trash2 } from 'lucide-react';
import Avatar from '../Avatar/Avatar';
import { TeamListItemProps } from '@/app/types/globalTypes';

// Helper function to get display values
const getDisplayData = (user: { name?: string | null; image?: string | null; custom_name?: string | null; custom_image?: string | null; email?: string }) => ({
     name: user.custom_name || user.name || user.email || 'User',
     image: user.custom_image || user.image,
});

const TeamListItem = ({ team, onEditTeam, onDeleteTeam, availableUsers }: TeamListItemProps) => {
     // All members of this team
     const teamMembers = availableUsers.filter((user) => team.users.some((member) => member.user_id === user.id));

     // **Find the creator (owner) by ID**
     const creator = availableUsers.find((u) => u.id === team.owner_id);
     const creatorDisplay = creator ? getDisplayData(creator) : null;

     return (
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all duration-200 group hover:shadow-lg min-h-[280px] flex flex-col">
               {/* Header */}
               <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                         <div className="p-3 bg-blue-500/10 rounded-xl">
                              <Users className="w-6 h-6 text-blue-400" />
                         </div>
                         <div>
                              <h4
                                   className="font-semibold text-xl text-white transition-colors leading-tight"
                                   dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(team.name),
                                   }}
                              />
                              <p className="text-slate-400 text-sm mt-1">
                                   {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                              </p>
                              {creatorDisplay && (
                                   <span className="inline-flex items-center text-xs text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded-md mt-1.5">
                                        Created by {creatorDisplay.name}
                                   </span>
                              )}
                         </div>
                    </div>
               </div>

               {/* Member list */}
               <div className="flex-1 mb-6">
                    <p className="text-slate-400 text-sm font-medium mb-4">Team Members</p>
                    <div className="space-y-3">
                         {teamMembers.slice(0, 4).map((user) => {
                              const userDisplay = getDisplayData(user);
                              return (
                                   <div key={user.id} className="flex items-center gap-3 bg-slate-700/30 rounded-xl px-4 py-3 hover:bg-slate-700/50 transition-colors">
                                        {userDisplay.image ? <Avatar src={userDisplay.image} alt={userDisplay.name} size={32} /> : <div className="w-8 h-8 bg-slate-600 rounded-full" />}
                                        <div className="flex-1 min-w-0">
                                             <p className="text-white text-sm font-medium truncate">{userDisplay.name}</p>
                                             <p className="text-slate-400 text-xs truncate">{user.email}</p>
                                        </div>
                                   </div>
                              );
                         })}
                         {teamMembers.length > 4 && (
                              <div className="flex items-center justify-center bg-slate-700/30 rounded-xl px-4 py-3">
                                   <span className="text-slate-400 text-sm font-medium">+{teamMembers.length - 4} more</span>
                              </div>
                         )}
                         {teamMembers.length === 0 && (
                              <div className="text-center py-4">
                                   <p className="text-slate-500 text-sm">No members assigned</p>
                              </div>
                         )}
                    </div>
               </div>

               {/* Actions */}
               <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                    <button
                         onClick={() => onEditTeam(team)}
                         className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-slate-600"
                    >
                         <Pencil className="w-4 h-4" />
                         Edit Team
                    </button>
                    <button
                         onClick={() => onDeleteTeam(team.id)}
                         className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 font-medium px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-400/50"
                    >
                         <Trash2 className="w-4 h-4" />
                    </button>
               </div>
          </div>
     );
};

export default TeamListItem;

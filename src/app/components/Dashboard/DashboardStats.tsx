import { FaCalendarAlt, FaPlus, FaUserFriends } from 'react-icons/fa';

interface DashboardStatsProps {
     totalBoards: number;
     totalTasks: number;
     totalMembers: number;
}

export const DashboardStats = ({ totalBoards, totalTasks, totalMembers }: DashboardStatsProps) => {
     return (
          <div className="pb-10 grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
               <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-5 flex items-center gap-4 shadow-sm">
                    <span className="bg-blue-600/30 text-blue-300 p-2 rounded-xl text-2xl">
                         <FaCalendarAlt />
                    </span>
                    <div>
                         <div className="text-sm text-slate-400">Total Boards</div>
                         <div className="text-xl font-bold text-white">{totalBoards}</div>
                    </div>
               </div>

               <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-5 flex items-center gap-4 shadow-sm">
                    <span className="bg-green-600/20 text-green-300 p-2 rounded-xl text-2xl">
                         <FaPlus />
                    </span>
                    <div>
                         <div className="text-sm text-slate-400">Total Tasks</div>
                         <div className="text-xl font-bold text-white">{totalTasks}</div>
                    </div>
               </div>

               <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-5 flex items-center gap-4 shadow-sm">
                    <span className="bg-blue-600/20 text-blue-300 p-2 rounded-xl text-2xl">
                         <FaUserFriends />
                    </span>
                    <div>
                         <div className="text-sm text-slate-400">Team Members (all)</div>
                         <div className="text-xl font-bold text-white">{totalMembers}</div>
                    </div>
               </div>
          </div>
     );
};

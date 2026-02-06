import { LayoutDashboard, CheckSquare, Users } from 'lucide-react';

interface DashboardStatsProps {
     totalBoards: number;
     totalTasks: number;
     totalMembers: number;
}

export const DashboardStats = ({ totalBoards, totalTasks, totalMembers }: DashboardStatsProps) => {
     return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
               <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/15">
                         <LayoutDashboard className="w-4.5 h-4.5 text-blue-400" />
                    </div>
                    <div>
                         <p className="text-xs text-slate-400">Boards</p>
                         <p className="text-lg font-semibold text-white leading-tight">{totalBoards}</p>
                    </div>
               </div>

               <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/15">
                         <CheckSquare className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div>
                         <p className="text-xs text-slate-400">Tasks</p>
                         <p className="text-lg font-semibold text-white leading-tight">{totalTasks}</p>
                    </div>
               </div>

               <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/15">
                         <Users className="w-4.5 h-4.5 text-violet-400" />
                    </div>
                    <div>
                         <p className="text-xs text-slate-400">Members</p>
                         <p className="text-lg font-semibold text-white leading-tight">{totalMembers}</p>
                    </div>
               </div>
          </div>
     );
};

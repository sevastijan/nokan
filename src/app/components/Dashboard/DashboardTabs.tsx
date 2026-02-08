'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, ListChecks } from 'lucide-react';

export type DashboardTab = 'boards' | 'tasks';

interface DashboardTabsProps {
     activeTab: DashboardTab;
     onTabChange: (tab: DashboardTab) => void;
     boardsCount: number;
     tasksCount: number;
}

const tabs: { id: DashboardTab; label: string; icon: typeof LayoutDashboard }[] = [
     { id: 'boards', label: 'Projekty', icon: LayoutDashboard },
     { id: 'tasks', label: 'Twoje Taski', icon: ListChecks },
];

export const DashboardTabs = ({ activeTab, onTabChange, boardsCount, tasksCount }: DashboardTabsProps) => {
     const counts: Record<DashboardTab, number> = {
          boards: boardsCount,
          tasks: tasksCount,
     };

     return (
          <div className="flex items-center gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1">
               {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    const count = counts[tab.id];

                    return (
                         <button
                              key={tab.id}
                              onClick={() => onTabChange(tab.id)}
                              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                                   isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                              }`}
                         >
                              {isActive && (
                                   <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute inset-0 bg-slate-700/80 border border-slate-600/50 rounded-lg shadow-lg shadow-blue-500/5"
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                   />
                              )}
                              <span className="relative flex items-center gap-2">
                                   <Icon className="w-4 h-4" />
                                   {tab.label}
                                   {count > 0 && (
                                        <span
                                             className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                  isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700/60 text-slate-400'
                                             }`}
                                        >
                                             {count}
                                        </span>
                                   )}
                              </span>
                         </button>
                    );
               })}
          </div>
     );
};

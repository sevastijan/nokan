'use client';

import { FiGrid, FiList } from 'react-icons/fi';

interface ViewModeToggleProps {
     viewMode: 'columns' | 'list';
     onViewModeChange: (mode: 'columns' | 'list') => void;
}

const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
     return (
          <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50">
               <button
                    onClick={() => onViewModeChange('columns')}
                    className={`
                         flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                         ${viewMode === 'columns' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}
                    `}
               >
                    <FiGrid className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Tablica</span>
               </button>
               <button
                    onClick={() => onViewModeChange('list')}
                    className={`
                         flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                         ${viewMode === 'list' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}
                    `}
               >
                    <FiList className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">Lista</span>
               </button>
          </div>
     );
};

export default ViewModeToggle;

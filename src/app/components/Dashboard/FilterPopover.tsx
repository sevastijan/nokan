interface FilterPopoverProps {
     hasTasksOnly: boolean;
     setHasTasksOnly: (v: boolean) => void;
     hasMembersOnly: boolean;
     setHasMembersOnly: (v: boolean) => void;
     clearFilters: () => void;
}

export const FilterPopover = ({ hasTasksOnly, setHasTasksOnly, hasMembersOnly, setHasMembersOnly, clearFilters }: FilterPopoverProps) => (
     <div className="w-48 bg-slate-800/95 border border-slate-700/50 rounded-lg shadow-xl z-50 p-3 text-sm text-slate-200">
          <div className="font-medium text-white mb-2">Filters</div>
          <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer">
               <input type="checkbox" checked={hasTasksOnly} onChange={(e) => setHasTasksOnly(e.target.checked)} className="form-checkbox text-purple-500 focus:ring-purple-400" />
               <span>Has tasks</span>
          </label>
          <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer">
               <input type="checkbox" checked={hasMembersOnly} onChange={(e) => setHasMembersOnly(e.target.checked)} className="form-checkbox text-purple-500 focus:ring-purple-400" />
               <span>Has team members</span>
          </label>
          <button onClick={clearFilters} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
               Clear all
          </button>
     </div>
);

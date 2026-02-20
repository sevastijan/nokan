'use client';

import { useTranslation } from 'react-i18next';

interface FilterPopoverProps {
     hasTasksOnly: boolean;
     setHasTasksOnly: (v: boolean) => void;
     hasMembersOnly: boolean;
     setHasMembersOnly: (v: boolean) => void;
     clearFilters: () => void;
}

export const FilterPopover = ({ hasTasksOnly, setHasTasksOnly, hasMembersOnly, setHasMembersOnly, clearFilters }: FilterPopoverProps) => {
     const { t } = useTranslation();

     return (
          <div className="w-48 bg-slate-800/95 border border-slate-700/50 rounded-lg shadow-xl z-50 p-3 text-sm text-slate-200">
               <div className="font-medium text-white mb-2">{t('dashboard.filters')}</div>
               <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer">
                    <input type="checkbox" checked={hasTasksOnly} onChange={(e) => setHasTasksOnly(e.target.checked)} className="form-checkbox text-brand-500 focus:ring-brand-400" />
                    <span>{t('dashboard.hasTasks')}</span>
               </label>
               <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer">
                    <input type="checkbox" checked={hasMembersOnly} onChange={(e) => setHasMembersOnly(e.target.checked)} className="form-checkbox text-brand-500 focus:ring-brand-400" />
                    <span>{t('dashboard.hasTeamMembers')}</span>
               </label>
               <button onClick={clearFilters} className="mt-2 text-xs text-brand-400 hover:text-brand-300">
                    {t('dashboard.clearAll')}
               </button>
          </div>
     );
};

'use client';

import { ReactNode } from 'react';

interface FilterRadioItemProps {
     name: string;
     checked: boolean;
     onChange: () => void;
     children: ReactNode;
}

const FilterRadioItem = ({ name, checked, onChange, children }: FilterRadioItemProps) => {
     return (
          <label
               className={`
                    flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors
                    ${checked ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}
               `}
          >
               <div
                    className={`
                         w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                         ${checked ? 'border-slate-400 bg-slate-400' : 'border-slate-600'}
                    `}
               >
                    {checked && <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
               </div>
               <input type="radio" name={name} className="hidden" checked={checked} onChange={onChange} />
               {children}
          </label>
     );
};

export default FilterRadioItem;

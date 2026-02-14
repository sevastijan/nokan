'use client';

import { FiLink, FiInfo } from 'react-icons/fi';
import { FaBug } from 'react-icons/fa';

interface BugFieldsProps {
     bugUrl: string;
     bugScenario: string;
     onBugUrlChange: (value: string) => void;
     onBugScenarioChange: (value: string) => void;
}

const BugFields = ({ bugUrl, bugScenario, onBugUrlChange, onBugScenarioChange }: BugFieldsProps) => {
     return (
          <div className="bg-slate-800/40 rounded-xl border border-red-500/20 p-4 space-y-4">
               <div className="flex items-center gap-2 pb-2 border-b border-red-500/20">
                    <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-rose-500 rounded-full" />
                    <FaBug className="w-3.5 h-3.5 text-red-400" />
                    <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Szczegoly buga</h3>
               </div>

               {/* Bug URL */}
               <div>
                    <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                         <FiLink className="w-3.5 h-3.5 text-red-400" />
                         <span>Link do miejsca gdzie jest bug</span>
                         <span className="text-red-400">(wymagane)</span>
                    </label>
                    <input
                         type="url"
                         value={bugUrl}
                         onChange={(e) => onBugUrlChange(e.target.value)}
                         placeholder="https://..."
                         className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                    />
               </div>

               {/* Bug Scenario */}
               <div>
                    <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                         <span>Scenariusz</span>
                    </label>
                    <textarea
                         value={bugScenario}
                         onChange={(e) => onBugScenarioChange(e.target.value)}
                         placeholder="Opisz kroki do odtworzenia buga..."
                         rows={3}
                         className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                    />
               </div>

               {/* Info banner */}
               <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-3 py-2.5 border border-slate-600/30">
                    <FiInfo className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-400">Dodaj zrzuty ekranu w sekcji <span className="text-slate-300 font-medium">Zalaczniki</span> ponizej, aby lepiej zobrazowac problem.</p>
               </div>
          </div>
     );
};

export default BugFields;

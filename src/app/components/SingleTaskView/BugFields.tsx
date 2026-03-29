'use client';

import { useState, useEffect } from 'react';
import { FiMonitor, FiSmartphone } from 'react-icons/fi';

type Platform = 'web' | 'mobile' | null;

interface BugFieldsProps {
     bugUrl: string;
     bugScenario: string;
     onBugUrlChange: (value: string) => void;
     onBugScenarioChange: (value: string) => void;
     hasError?: boolean;
}

const BugFields = ({ bugUrl, bugScenario, onBugUrlChange, onBugScenarioChange, hasError }: BugFieldsProps) => {
     // Platform stored in bugScenario field: "platform:web" or "platform:mobile"
     const [platform, setPlatform] = useState<Platform>(() => {
          if (bugScenario === 'platform:mobile') return 'mobile';
          if (bugScenario === 'platform:web') return 'web';
          // Legacy: try to detect from bugUrl
          if (bugUrl?.startsWith('app://')) return 'mobile';
          if (bugUrl) return 'web';
          return null;
     });
     const [touched, setTouched] = useState(false);

     // Sync platform when data loads
     useEffect(() => {
          if (bugScenario === 'platform:mobile') setPlatform('mobile');
          else if (bugScenario === 'platform:web') setPlatform('web');
          else if (bugUrl?.startsWith('app://')) setPlatform('mobile');
          else if (bugUrl) setPlatform('web');
     }, [bugScenario, bugUrl]);

     const handlePlatformChange = (p: Platform) => {
          setPlatform(p);
          onBugScenarioChange(`platform:${p}`);
          // Clean legacy app:// prefix if switching
          if (p === 'web' && bugUrl.startsWith('app://')) {
               onBugUrlChange(bugUrl.replace('app://', ''));
          }
     };

     const showPlatformError = hasError && !platform;

     // Clean display value - strip legacy app:// prefix
     const displayUrl = bugUrl.startsWith('app://') ? bugUrl.replace('app://', '') : bugUrl;

     return (
          <div>
               <p className="text-xs text-slate-400 mb-1">Gdzie występuje błąd?</p>
               <p className="text-[11px] text-slate-500 mb-3">Wskaż, gdzie dokładnie występuje problem</p>

               <div className={`space-y-2 ${showPlatformError ? 'ring-1 ring-red-500/40 rounded-lg p-1' : ''}`}>
                    {/* Web option */}
                    <div
                         onClick={() => handlePlatformChange('web')}
                         className={`rounded-lg cursor-pointer transition ${
                              platform === 'web'
                                   ? 'bg-slate-800 ring-1 ring-brand-500/40'
                                   : 'bg-slate-800/50 hover:bg-slate-800'
                         }`}
                    >
                         <div className="px-3 py-2.5">
                              <div className="flex items-center gap-2 mb-1">
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                        platform === 'web' ? 'border-brand-500' : 'border-slate-600'
                                   }`}>
                                        {platform === 'web' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                                   </div>
                                   <FiMonitor className={`w-4 h-4 shrink-0 ${platform === 'web' ? 'text-slate-200' : 'text-slate-500'}`} />
                                   <p className={`text-sm ${platform === 'web' ? 'text-slate-200' : 'text-slate-400'}`}>Strona internetowa</p>
                              </div>
                              <p className="text-[11px] text-slate-500 pl-6">Błąd na stronie www lub aplikacji webowej</p>
                         </div>
                         {platform === 'web' && (
                              <div className="px-3 pb-3 pt-1">
                                   <input
                                        type="text"
                                        value={displayUrl}
                                        onChange={(e) => onBugUrlChange(e.target.value)}
                                        onBlur={() => setTouched(true)}
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="Wklej link do strony z błędem..."
                                        className={`w-full bg-slate-900/50 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition ${hasError && platform === 'web' ? 'ring-1 ring-red-500/50' : ''}`}
                                        autoFocus
                                   />
                                   {hasError && platform === 'web' && <p className="text-[11px] text-red-400/70 mt-1">Podaj adres strony</p>}
                              </div>
                         )}
                    </div>

                    {/* Mobile option */}
                    <div
                         onClick={() => handlePlatformChange('mobile')}
                         className={`rounded-lg cursor-pointer transition ${
                              platform === 'mobile'
                                   ? 'bg-slate-800 ring-1 ring-brand-500/40'
                                   : 'bg-slate-800/50 hover:bg-slate-800'
                         }`}
                    >
                         <div className="px-3 py-2.5">
                              <div className="flex items-center gap-2 mb-1">
                                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                        platform === 'mobile' ? 'border-brand-500' : 'border-slate-600'
                                   }`}>
                                        {platform === 'mobile' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                                   </div>
                                   <FiSmartphone className={`w-4 h-4 shrink-0 ${platform === 'mobile' ? 'text-slate-200' : 'text-slate-500'}`} />
                                   <p className={`text-sm ${platform === 'mobile' ? 'text-slate-200' : 'text-slate-400'}`}>Aplikacja mobilna</p>
                              </div>
                              <p className="text-[11px] text-slate-500 pl-6">Błąd w aplikacji na telefonie lub tablecie</p>
                         </div>
                         {platform === 'mobile' && (
                              <div className="px-3 pb-3 pt-1">
                                   <input
                                        type="text"
                                        value={displayUrl}
                                        onChange={(e) => onBugUrlChange(e.target.value)}
                                        onBlur={() => setTouched(true)}
                                        onClick={(e) => e.stopPropagation()}
                                        placeholder="np. Profil użytkownika, Ustawienia → Powiadomienia"
                                        className={`w-full bg-slate-900/50 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition ${hasError && platform === 'mobile' ? 'ring-1 ring-red-500/50' : ''}`}
                                        autoFocus
                                   />
                                   {hasError && platform === 'mobile' && <p className="text-[11px] text-red-400/70 mt-1">Opisz lokalizację błędu</p>}
                              </div>
                         )}
                    </div>
               </div>
               {showPlatformError && <p className="text-[11px] text-red-400/70 mt-2">Wybierz, gdzie występuje błąd</p>}
          </div>
     );
};

export default BugFields;

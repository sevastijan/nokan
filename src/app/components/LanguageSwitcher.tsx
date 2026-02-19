'use client';

import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
     const { i18n } = useTranslation();
     const currentLang = i18n.language?.startsWith('pl') ? 'pl' : 'en';

     const toggle = () => {
          i18n.changeLanguage(currentLang === 'pl' ? 'en' : 'pl');
     };

     return (
          <button
               onClick={toggle}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/70 transition-all cursor-pointer"
               aria-label="Switch language"
          >
               <span className={currentLang === 'pl' ? 'text-white font-semibold' : ''}>PL</span>
               <span className="text-slate-600">/</span>
               <span className={currentLang === 'en' ? 'text-white font-semibold' : ''}>EN</span>
          </button>
     );
};

export default LanguageSwitcher;

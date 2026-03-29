'use client';

import { useState, useEffect } from 'react';
import { usePWASplash } from '../context/PWASplashContext';
import { useTranslation } from 'react-i18next';

interface LoaderProps {
     text?: string;
}

const Loader = ({ text }: LoaderProps) => {
     const { t } = useTranslation();
     const displayText = text ?? t('common.loading');
     const { isSplashActive } = usePWASplash();
     const [visible, setVisible] = useState(false);

     useEffect(() => {
          const timer = setTimeout(() => setVisible(true), 150);
          return () => clearTimeout(timer);
     }, []);

     if (isSplashActive || !visible) return null;

     return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 select-none animate-[fadeIn_0.3s_ease-out]">
               <img
                    src="/logo.svg"
                    alt="Nokan"
                    className="w-12 h-12 animate-pulse"
                    style={{ animationDuration: '2s' }}
               />

               <style>{`
                    @keyframes fadeIn {
                         from { opacity: 0; }
                         to { opacity: 1; }
                    }
               `}</style>
          </div>
     );
};

export default Loader;

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface PWASplashContextValue {
     isSplashActive: boolean;
     dismissSplash: () => void;
}

const PWASplashContext = createContext<PWASplashContextValue>({
     isSplashActive: false,
     dismissSplash: () => {},
});

export function usePWASplash() {
     return useContext(PWASplashContext);
}

export function PWASplashProvider({ isStandalone, children }: { isStandalone: boolean; children: ReactNode }) {
     const [isSplashActive, setIsSplashActive] = useState(isStandalone);

     // Sync with async standalone detection — usePWAStandalone starts
     // as false and flips to true after the first useEffect, so the
     // initial useState(false) would never activate the splash.
     useEffect(() => {
          if (isStandalone) {
               setIsSplashActive(true);
          }
     }, [isStandalone]);

     const dismissSplash = useCallback(() => {
          setIsSplashActive(false);
     }, []);

     return (
          <PWASplashContext.Provider value={{ isSplashActive, dismissSplash }}>
               {children}
          </PWASplashContext.Provider>
     );
}

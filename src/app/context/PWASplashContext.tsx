'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

     const dismissSplash = useCallback(() => {
          setIsSplashActive(false);
     }, []);

     return (
          <PWASplashContext.Provider value={{ isSplashActive, dismissSplash }}>
               {children}
          </PWASplashContext.Provider>
     );
}
